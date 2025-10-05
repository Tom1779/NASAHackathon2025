import { ref, type Ref } from 'vue'
import type { Asteroid, CloseApproachData, EstimatedDiameter } from '../types/asteroid'
import { fetchNeoData, fetchNeoDetails } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'
import {
  fetchCatalogEntries,
  catalogEntriesToAsteroids,
  preloadCatalog,
} from '../utils/catalogLoader'

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

const CATALOG_PAGE_SIZE = 120

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

const flattenNearEarthObjects = (grouped: unknown): NeoApiObject[] => {
  if (!grouped || typeof grouped !== 'object') return []
  return Object.values(grouped as Record<string, unknown>).flatMap(value => {
    if (!Array.isArray(value)) return []
    return value.filter(isNeoApiObject)
  })
}

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

export function useAsteroids() {
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const catalogQuery = ref('')
  const catalogHasMore = ref(false)
  const catalogCursor = ref<string | null>(null)
  const catalogScanned = ref(0)
  const catalogInitialized = ref(false)
  const catalogAbort = ref<AbortController | null>(null)

  const updateAsteroidsFromCatalog = (entries: Asteroid[], append: boolean) => {
    asteroids.value = append ? [...asteroids.value, ...entries] : entries
  }

  const runCatalogSearch = async (query: string, append = false): Promise<Asteroid[]> => {
    catalogAbort.value?.abort()
    const controller = new AbortController()
    catalogAbort.value = controller
    loading.value = true
    error.value = null

    try {
      const result = await fetchCatalogEntries({
        query,
        limit: CATALOG_PAGE_SIZE,
        cursorId: append ? catalogCursor.value : null,
        signal: controller.signal,
      })

      catalogQuery.value = query
      catalogHasMore.value = result.hasMore
      catalogScanned.value = result.scanned

      const lastEntry = result.entries[result.entries.length - 1]
      catalogCursor.value = lastEntry ? lastEntry.id : append ? catalogCursor.value : null

      const page = catalogEntriesToAsteroids(result.entries)
      updateAsteroidsFromCatalog(page, append)

      catalogInitialized.value = true
      return asteroids.value
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return asteroids.value
      }

      console.warn('Catalog search failed', err)
      error.value = err instanceof Error ? err.message : 'Catalog search failed'
      throw err
    } finally {
      if (catalogAbort.value === controller) {
        catalogAbort.value = null
      }
      loading.value = false
    }
  }

  const searchAsteroids = async (query: string): Promise<Asteroid[]> => {
    catalogCursor.value = null
    return runCatalogSearch(query.trim(), false)
  }

  const loadMoreAsteroids = async (): Promise<Asteroid[]> => {
    if (!catalogHasMore.value) {
      return asteroids.value
    }
    return runCatalogSearch(catalogQuery.value, true)
  }

  const ensureCatalogPrefetched = async () => {
    if (catalogInitialized.value) return
    try {
      const result = await preloadCatalog(CATALOG_PAGE_SIZE)
      if (result?.entries?.length) {
        const lastEntry = result.entries[result.entries.length - 1]
        catalogQuery.value = ''
        catalogHasMore.value = result.hasMore
        catalogCursor.value = lastEntry ? lastEntry.id : null
        catalogScanned.value = result.scanned
        updateAsteroidsFromCatalog(catalogEntriesToAsteroids(result.entries), false)
        catalogInitialized.value = true
      }
    } catch (err) {
      console.debug('Catalog preload skipped', err)
    }
  }

  const fetchAsteroids = async () => {
    loading.value = true
    error.value = null

    try {
      const start = new Date().toISOString().slice(0, 10)
      const end = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const data = await fetchNeoData(start, end)
  const root = data as Record<string, unknown> | undefined
  const grouped = getRecord(root?.['near_earth_objects'])
      const allItems = flattenNearEarthObjects(grouped)

      asteroids.value = allItems.map(mapNeoToAsteroid)
    } catch (err) {
      console.error('Error fetching asteroids:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch asteroids'
      asteroids.value = []
    } finally {
      loading.value = false
    }
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
    loading,
    error,
    catalogQuery,
    catalogHasMore,
    catalogScanned,
    fetchAsteroids,
    searchAsteroids,
    loadMoreAsteroids,
    fetchDetailsForId,
    ensureCatalogPrefetched,
  }
}
