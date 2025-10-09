import { ref, type Ref } from 'vue'
import type { Asteroid, CloseApproachData, EstimatedDiameter } from '../types/asteroid'
import { fetchNeoData, fetchNeoDetails } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'

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
    .filter(item => item && typeof item === 'object')
    .map(item => {
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
  }
}

const extractPhysParam = (params: SbdbPhysicalParam[], name: string): unknown =>
  params.find(param => param.name === name)?.value

// In-memory cache instead of localStorage (localStorage is too small for 40K asteroids)
let memoryCache: {
  data: Asteroid[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function useAsteroids() {
  const allAsteroids: Ref<Asteroid[]> = ref([]) // All loaded asteroids
  const asteroids: Ref<Asteroid[]> = ref([]) // Filtered/searched asteroids
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isLoadingAll = ref(false)
  const allDataLoaded = ref(false)

  // Load asteroids from local JSON file
  const loadAllAsteroidsFromJson = async (): Promise<void> => {
    if (allDataLoaded.value) return
    
    // Check in-memory cache first
    if (memoryCache.data && (Date.now() - memoryCache.timestamp < CACHE_DURATION)) {
      allAsteroids.value = memoryCache.data
      asteroids.value = memoryCache.data
      allDataLoaded.value = true
      console.log(`Loaded ${allAsteroids.value.length} asteroids from memory cache.`)
      return
    }

    isLoadingAll.value = true
    loading.value = true
    
    try {
      console.log('Fetching asteroids from JSON file...')
      
      // Fetch the local JSON file
      const response = await fetch('/all_neo_data.json')
      if (!response.ok) {
        throw new Error(`Failed to load asteroids: ${response.statusText}`)
      }
      
      const data = await response.json()
      const neoObjects = data.near_earth_objects || []
      
      console.log(`Processing ${neoObjects.length} asteroid records...`)
      
      allAsteroids.value = neoObjects.map((neo: any) => mapNeoToAsteroid(neo))
      asteroids.value = allAsteroids.value
      allDataLoaded.value = true
      
      // Save to in-memory cache
      memoryCache = {
        data: allAsteroids.value,
        timestamp: Date.now()
      }
      
      console.log(`Successfully loaded ${allAsteroids.value.length} asteroids.`)
    } catch (err) {
      console.error('Error loading asteroids from JSON:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load asteroids'
      throw err
    } finally {
      isLoadingAll.value = false
      loading.value = false
    }
  }

  // Search asteroids locally
  const searchAsteroids = async (query: string): Promise<Asteroid[]> => {
    // Ensure all data is loaded first
    if (!allDataLoaded.value) {
      await loadAllAsteroidsFromJson()
    }

    const trimmedQuery = query.trim().toLowerCase()
    
    if (!trimmedQuery) {
      asteroids.value = allAsteroids.value
      return asteroids.value
    }

    // Search by name and ID
    asteroids.value = allAsteroids.value.filter(asteroid => 
      asteroid.name.toLowerCase().includes(trimmedQuery) ||
      asteroid.id.toLowerCase().includes(trimmedQuery) ||
      asteroid.neo_reference_id.toLowerCase().includes(trimmedQuery)
    )

    console.log(`Search for "${query}" found ${asteroids.value.length} results`)
    return asteroids.value
  }

  // Legacy compatibility - no pagination needed with local data
  const loadMoreAsteroids = async (): Promise<Asteroid[]> => {
    return asteroids.value
  }

  const ensureCatalogPrefetched = async () => {
    if (!allDataLoaded.value) {
      await loadAllAsteroidsFromJson()
    }
  }

  const fetchAsteroids = async () => {
    // For backwards compatibility, just load all asteroids
    await loadAllAsteroidsFromJson()
  }

  const detailsCache = new Map<string, Asteroid>()

  const fetchDetailsForId = async (id: string): Promise<Asteroid | undefined> => {
    if (!id) return undefined
    if (detailsCache.has(id)) return detailsCache.get(id)

    try {
      const sbdbRaw = (await fetchSmallBodyData(id)) as SbdbResponse
      const objectRecord = getRecord(sbdbRaw.object) ?? getRecord(sbdbRaw)
      const orbitRecord = getRecord(sbdbRaw.orbit)
      const physPar = toPhysicalParams(sbdbRaw.phys_par)

      const name =
        (objectRecord &&
          (asString(objectRecord['full_name'])
            || asString(objectRecord['fullname'])
            || asString(objectRecord['designation'])))
        || `ID ${id}`

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
        tholen_spectral_type: asString(extractPhysParam(physPar, 'spec_T')) || undefined,
        smassii_spectral_type: asString(extractPhysParam(physPar, 'spec_B')) || undefined,
        diameter_km: (() => {
          const value = extractPhysParam(physPar, 'diameter')
          const numeric = toNumber(value, Number.NaN)
          return Number.isNaN(numeric) ? undefined : numeric
        })(),
        geometric_albedo: (() => {
          const value = extractPhysParam(physPar, 'albedo')
          const numeric = toNumber(value, Number.NaN)
          return Number.isNaN(numeric) ? undefined : numeric
        })(),
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
          const mergedDiameter = Object.keys(mapped.estimated_diameter || {}).length > 0
            ? mapped.estimated_diameter
            : asteroid.estimated_diameter

          const enriched: Asteroid = {
            ...asteroid,
            ...mapped,
            estimated_diameter: mergedDiameter,
            absolute_magnitude_h: mapped.absolute_magnitude_h || asteroid.absolute_magnitude_h,
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
      return undefined
    }
  }

  return {
    asteroids,
    allAsteroids,
    loading,
    error,
    isLoadingAll,
    allDataLoaded,
    fetchAsteroids,
    searchAsteroids,
    loadMoreAsteroids,
    loadAllAsteroidsFromJson,
    fetchDetailsForId,
    ensureCatalogPrefetched,
  }
}