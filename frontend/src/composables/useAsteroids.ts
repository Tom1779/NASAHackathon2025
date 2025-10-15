import { ref, type Ref } from 'vue'
import type { Asteroid, CloseApproachData, EstimatedDiameter } from '../types/asteroid'
import { fetchNeoData, fetchNeoDetails } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'
import { useIndexedDBCache } from './useIndexedDBCache'

interface NeoApiDiameterRange {
  estimated_diameter_min?: number | string
  estimated_diameter_max?: number | string
}

interface NeoApiEstimatedDiameter {
  kilometers?: NeoApiDiameterRange
  meters?: NeoApiDiameterRange
  feet?: NeoApiDiameterRange
  miles?: NeoApiDiameterRange
}

interface NeoApiObject {
  links?: { self?: unknown }
  id?: string | number
  neo_reference_id?: string | number
  name?: unknown
  nasa_jpl_url?: unknown
  absolute_magnitude_h?: unknown
  estimated_diameter?: NeoApiEstimatedDiameter
  is_potentially_hazardous_asteroid?: unknown
  close_approach_data?: unknown
  is_sentry_object?: unknown
}

interface SbdbPhysicalParam {
  name?: string
  value?: unknown
}

interface SbdbResponse {
  object?: unknown
  phys_par?: unknown
  orbit?: unknown
  [key: string]: unknown
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value
  const num = Number(value)
  return Number.isNaN(num) ? fallback : num
}

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  return fallback
}

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  if (typeof value === 'number') return value !== 0
  return fallback
}

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

const isNeoApiObject = (value: unknown): value is NeoApiObject =>
  typeof value === 'object' && value !== null

const toEstimatedDiameter = (source?: NeoApiEstimatedDiameter): EstimatedDiameter => {
  const result: EstimatedDiameter = {}

  const assignRange = (range?: NeoApiDiameterRange) => {
    if (!range) return undefined
    const min = toNumber(range.estimated_diameter_min, Number.NaN)
    const max = toNumber(range.estimated_diameter_max, Number.NaN)
    if (Number.isNaN(min) || Number.isNaN(max)) return undefined
    return {
      estimated_diameter_min: min,
      estimated_diameter_max: max,
    }
  }

  const km = assignRange(source?.kilometers)
  if (km) result.kilometers = km
  const m = assignRange(source?.meters)
  if (m) result.meters = m
  const ft = assignRange(source?.feet)
  if (ft) result.feet = ft
  const mi = assignRange(source?.miles)
  if (mi) result.miles = mi

  return result
}

const toPhysicalParams = (value: unknown): SbdbPhysicalParam[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const record = item as Record<string, unknown>
      return {
        name: typeof record.name === 'string' ? record.name : undefined,
        value: record.value,
      }
    })
}

const mapNeoToAsteroid = (neo: NeoApiObject): Asteroid => {
  const estimated = toEstimatedDiameter(neo.estimated_diameter)
  const closeApproach = Array.isArray(neo.close_approach_data)
    ? (neo.close_approach_data as CloseApproachData[])
    : []

  const id = neo.id ?? neo.neo_reference_id ?? ''
  const referenceId = neo.neo_reference_id ?? neo.id ?? ''

  // Extract any additional fields that might be in the raw data
  const rawNeo = neo as any

  return {
    links: { self: asString(neo.links?.self) },
    id: String(id),
    neo_reference_id: String(referenceId),
    name: asString(neo.name, 'Unknown'),
    nasa_jpl_url: asString(neo.nasa_jpl_url),
    absolute_magnitude_h: toNumber(neo.absolute_magnitude_h, 0),
    estimated_diameter: estimated,
    is_potentially_hazardous_asteroid: asBoolean(neo.is_potentially_hazardous_asteroid, false),
    close_approach_data: closeApproach,
    is_sentry_object: asBoolean(neo.is_sentry_object, false),
    // Include spectral types if they exist in the data
    tholen_spectral_type: asString(rawNeo.tholen_spectral_type) || undefined,
    smassii_spectral_type: asString(rawNeo.smassii_spectral_type) || undefined,
    diameter_km: toNumber(rawNeo.diameter_km, undefined),
    geometric_albedo: toNumber(rawNeo.geometric_albedo, undefined),
  }
}

const extractPhysParam = (params: SbdbPhysicalParam[], name: string): unknown =>
  params.find((param) => param.name === name)?.value

export function useAsteroids() {
  const { cachedAsteroids, isCacheLoaded, loadCache, saveCache } = useIndexedDBCache()
  const allAsteroids: Ref<Asteroid[]> = ref([])
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isLoadingAll = ref(false)
  const allDataLoaded = ref(false)
  const loadingProgress = ref(0)
  const loadingStatusText = ref('Initializing...')

  const loadAllAsteroidsFromJson = async (): Promise<void> => {
    if (allDataLoaded.value) return

    loadingProgress.value = 0
    loadingStatusText.value = 'Checking cache...'

    const cacheLoaded = await loadCache()
    if (cacheLoaded && cachedAsteroids.value.length > 0) {
      allAsteroids.value = cachedAsteroids.value
      asteroids.value = cachedAsteroids.value
      allDataLoaded.value = true
      loadingProgress.value = 100
      loadingStatusText.value = 'Loaded from cache'
      console.log(`✓ Using cached data (${allAsteroids.value.length} asteroids)`)
      return
    }

    isLoadingAll.value = true
    loading.value = true

    try {
      loadingStatusText.value = 'Loading manifest...'
      loadingProgress.value = 5

      console.log('📥 Loading asteroid data...')

      // Base URL for chunks with fallback to your GitHub repo
      const baseUrl =
        import.meta.env.VITE_NEO_BASE_URL ||
        'https://raw.githubusercontent.com/Tom1779/neo-asteroid-data/main/chunks'

      console.log(`📍 Using base URL: ${baseUrl}`)

      // Load manifest first
      const manifestUrl = `${baseUrl}/manifest.json`
      console.log('📄 Loading manifest...')

      const manifestResponse = await fetch(manifestUrl)

      if (!manifestResponse.ok) {
        throw new Error(`Failed to load manifest: ${manifestResponse.statusText}`)
      }

      const manifest = await manifestResponse.json()
      const totalChunks = manifest.total_chunks

      loadingProgress.value = 10
      loadingStatusText.value = `Loading ${totalChunks} chunks...`
      console.log(`📦 Loading ${totalChunks} chunks (${manifest.total_asteroids} total asteroids)`)

      const allLoadedAsteroids: any[] = []

      // Load chunks in parallel batches
      const BATCH_SIZE = 5 // Can be higher since it's a real CDN

      for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks)
        const batchPromises = []

        loadingStatusText.value = `Loading chunks ${batchStart + 1}-${batchEnd}...`

        for (let i = batchStart; i < batchEnd; i++) {
          const chunkUrl = `${baseUrl}/neo_chunk_${String(i).padStart(3, '0')}.json`

          batchPromises.push(
            fetch(chunkUrl)
              .then((response) => {
                if (!response.ok) {
                  console.warn(`⚠️ Failed to load chunk ${i} (${response.status})`)
                  return null
                }
                return response.json()
              })
              .catch((err) => {
                console.warn(`⚠️ Error loading chunk ${i}:`, err)
                return null
              }),
          )
        }

        const batchResults = await Promise.all(batchPromises)

        for (const chunkData of batchResults) {
          if (chunkData?.asteroids) {
            allLoadedAsteroids.push(...chunkData.asteroids)
          }
        }

        const loadProgress = 10 + (batchEnd / totalChunks) * 60
        loadingProgress.value = Math.round(loadProgress)

        const progress = ((batchEnd / totalChunks) * 100).toFixed(1)
        console.log(
          `  ✓ Loaded chunks ${batchStart}-${batchEnd - 1} (${progress}%) - ${allLoadedAsteroids.length} asteroids total`,
        )

        // Yield to browser every batch to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      loadingProgress.value = 70
      loadingStatusText.value = `Processing ${allLoadedAsteroids.length} asteroids...`

      console.log(`⚙️ Processing ${allLoadedAsteroids.length} asteroid records in batches...`)

      // Process asteroids in batches to avoid blocking main thread
      const PROCESS_BATCH_SIZE = 1000
      const processedAsteroids: Asteroid[] = []

      for (let i = 0; i < allLoadedAsteroids.length; i += PROCESS_BATCH_SIZE) {
        const batch = allLoadedAsteroids.slice(i, i + PROCESS_BATCH_SIZE)
        const processed = batch.map((neo: any) => mapNeoToAsteroid(neo))
        processedAsteroids.push(...processed)

        const processProgress = 70 + (i / allLoadedAsteroids.length) * 25
        loadingProgress.value = Math.round(processProgress)

        // Yield to browser after each batch
        if (i % (PROCESS_BATCH_SIZE * 5) === 0) {
          const progress = ((i / allLoadedAsteroids.length) * 100).toFixed(1)
          loadingStatusText.value = `Processing: ${progress}%`
          console.log(`  Processing: ${progress}%`)
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      loadingProgress.value = 95
      loadingStatusText.value = 'Finalizing...'

      allAsteroids.value = processedAsteroids
      asteroids.value = processedAsteroids
      allDataLoaded.value = true

      loadingProgress.value = 98
      loadingStatusText.value = 'Caching data...'

      console.log('💾 Caching to IndexedDB in background...')
      // Cache in background without blocking
      saveCache(processedAsteroids).catch((err) => {
        console.warn('Failed to cache:', err)
      })

      loadingProgress.value = 100
      loadingStatusText.value = `Loaded ${allAsteroids.value.length} asteroids!`

      console.log(`✅ Successfully loaded ${allAsteroids.value.length} asteroids!`)
    } catch (err) {
      console.error('❌ Error loading asteroids:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load asteroids'
      loadingStatusText.value = 'Error loading data'
      throw err
    } finally {
      isLoadingAll.value = false
      loading.value = false
    }
  }

  const searchAsteroids = async (query: string): Promise<Asteroid[]> => {
    if (!allDataLoaded.value) {
      await loadAllAsteroidsFromJson()
    }

    const trimmedQuery = query.trim().toLowerCase()

    if (!trimmedQuery) {
      asteroids.value = allAsteroids.value
      return asteroids.value
    }

    asteroids.value = allAsteroids.value.filter(
      (asteroid) =>
        asteroid.name.toLowerCase().includes(trimmedQuery) ||
        asteroid.id.toLowerCase().includes(trimmedQuery) ||
        asteroid.neo_reference_id.toLowerCase().includes(trimmedQuery),
    )

    console.log(`Search for "${query}" found ${asteroids.value.length} results`)
    return asteroids.value
  }

  const loadMoreAsteroids = async (): Promise<Asteroid[]> => {
    return asteroids.value
  }

  const ensureCatalogPrefetched = async () => {
    if (!allDataLoaded.value) {
      await loadAllAsteroidsFromJson()
    }
  }

  const fetchAsteroids = async () => {
    await loadAllAsteroidsFromJson()
  }

  const detailsCache = new Map<string, Asteroid>()

  const fetchDetailsForId = async (id: string): Promise<Asteroid | undefined> => {
    if (!id) return undefined
    if (detailsCache.has(id)) return detailsCache.get(id)

    // First, get the existing asteroid from our loaded data
    const existingAsteroid = allAsteroids.value.find(
      (a) => a.id === id || a.neo_reference_id === id,
    )

    try {
      const sbdbRaw = (await fetchSmallBodyData(id)) as SbdbResponse
      const objectRecord = getRecord(sbdbRaw.object) ?? getRecord(sbdbRaw)
      const orbitRecord = getRecord(sbdbRaw.orbit)
      const physPar = toPhysicalParams(sbdbRaw.phys_par)

      // Extract spectral types and physical data from SBDB
      const tholen_spectral_type = asString(extractPhysParam(physPar, 'spec_T')) || undefined
      const smassii_spectral_type = asString(extractPhysParam(physPar, 'spec_B')) || undefined

      const diameter_km = (() => {
        const value = extractPhysParam(physPar, 'diameter')
        const numeric = toNumber(value, Number.NaN)
        return Number.isNaN(numeric) ? undefined : numeric
      })()

      const geometric_albedo = (() => {
        const value = extractPhysParam(physPar, 'albedo')
        const numeric = toNumber(value, Number.NaN)
        return Number.isNaN(numeric) ? undefined : numeric
      })()

      // If we have the asteroid in our data, merge SBDB data with existing data
      if (existingAsteroid) {
        const enriched: Asteroid = {
          ...existingAsteroid, // Keep all original NEO data
          // Only add SBDB fields
          tholen_spectral_type,
          smassii_spectral_type,
          diameter_km,
          geometric_albedo,
        }

        detailsCache.set(id, enriched)

        // Update in allAsteroids array
        const index = allAsteroids.value.findIndex((a) => a.id === id || a.neo_reference_id === id)
        if (index !== -1) {
          allAsteroids.value[index] = enriched
        }

        return enriched
      }

      // If not found in our data, build from scratch (fallback)
      const name =
        (objectRecord &&
          (asString(objectRecord['full_name']) ||
            asString(objectRecord['fullname']) ||
            asString(objectRecord['designation']))) ||
        `ID ${id}`

      const diameterKm = toNumber(objectRecord?.['diameter_km'], Number.NaN)
      const estimatedDiameter: EstimatedDiameter = Number.isNaN(diameterKm)
        ? {}
        : {
            kilometers: {
              estimated_diameter_min: diameterKm * 0.9,
              estimated_diameter_max: diameterKm * 1.1,
            },
          }

      const asteroid: Asteroid = {
        links: { self: asString(objectRecord?.['self']) },
        id,
        neo_reference_id: id,
        name,
        nasa_jpl_url: asString(objectRecord?.['spk_url']) || asString(objectRecord?.['jpl_url']),
        absolute_magnitude_h: toNumber(objectRecord?.['H'], 0),
        estimated_diameter: estimatedDiameter,
        is_potentially_hazardous_asteroid: asBoolean(
          objectRecord?.['is_potentially_hazardous_asteroid'],
          false,
        ),
        close_approach_data: [],
        is_sentry_object: false,
        tholen_spectral_type,
        smassii_spectral_type,
        diameter_km,
        geometric_albedo,
      }

      detailsCache.set(id, asteroid)

      const orbitClass = asString(orbitRecord?.['class'])
      const isNeoCandidate =
        asBoolean(objectRecord?.['is_neo'], false) ||
        asBoolean(objectRecord?.['is_potentially_hazardous_asteroid'], false) ||
        /near/i.test(orbitClass)

      if (isNeoCandidate) {
        try {
          const neoResp = await fetchNeoDetails(id)
          const mapped = mapNeoToAsteroid(neoResp as NeoApiObject)
          const mergedDiameter =
            Object.keys(mapped.estimated_diameter || {}).length > 0
              ? mapped.estimated_diameter
              : asteroid.estimated_diameter

          const enriched: Asteroid = {
            ...asteroid,
            ...mapped,
            estimated_diameter: mergedDiameter,
            absolute_magnitude_h: mapped.absolute_magnitude_h || asteroid.absolute_magnitude_h,
            tholen_spectral_type,
            smassii_spectral_type,
            diameter_km,
            geometric_albedo,
          }

          detailsCache.set(id, enriched)
          return enriched
        } catch (neoError) {
          console.debug('No NEO details available for', id, neoError)
        }
      }

      return asteroid
    } catch (sbdbError) {
      console.warn('SBDB lookup failed for', id, sbdbError)
      return existingAsteroid
    }
  }

  return {
    asteroids,
    allAsteroids,
    loading,
    error,
    isLoadingAll,
    allDataLoaded,
    loadingProgress,
    loadingStatusText,
    fetchAsteroids,
    searchAsteroids,
    loadMoreAsteroids,
    loadAllAsteroidsFromJson,
    fetchDetailsForId,
    ensureCatalogPrefetched,
  }
}
