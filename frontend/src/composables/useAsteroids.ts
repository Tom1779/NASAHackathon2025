import { ref, type Ref } from 'vue'
import type { Asteroid } from '../types/asteroid'
import { fetchNeoData, fetchNeoDetails } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'
import sbdbCsv from '../data/sbdb_query_results.csv?raw'

export function useAsteroids() {
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** --- CSV Parsing (Lightweight SBDB Catalog) --- **/
  const catalog = ref<{ id: string; name: string }[]>([])
  try {
    const lines = (sbdbCsv as string)
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    const [, ...rows] = lines // skip header
    catalog.value = rows.map(r => {
      const [idRaw, ...nameParts] = r.split(',')
      return {
        id: (idRaw ?? '').replace(/"/g, '').trim(),
        name: nameParts.join(',').replace(/"/g, '').trim(),
      }
    }).filter(c => c.id && c.name)
  } catch (e) {
    console.warn('Failed to parse SBDB CSV catalog', e)
    catalog.value = []
  }

  /** --- Helper: Normalize NEO API Data --- **/
  const mapNeoToAsteroid = (neo: any): Asteroid => ({
    links: { self: neo?.links?.self || '' },
    id: String(neo?.id || neo?.neo_reference_id || ''),
    neo_reference_id: String(neo?.neo_reference_id || neo?.id || ''),
    name: neo?.name || 'Unknown',
    nasa_jpl_url: neo?.nasa_jpl_url || '',
    absolute_magnitude_h: Number(neo?.absolute_magnitude_h || 0),
    estimated_diameter: {
      kilometers: neo?.estimated_diameter?.kilometers && {
        estimated_diameter_min: +neo.estimated_diameter.kilometers.estimated_diameter_min || 0,
        estimated_diameter_max: +neo.estimated_diameter.kilometers.estimated_diameter_max || 0,
      },
      meters: neo?.estimated_diameter?.meters && {
        estimated_diameter_min: +neo.estimated_diameter.meters.estimated_diameter_min || 0,
        estimated_diameter_max: +neo.estimated_diameter.meters.estimated_diameter_max || 0,
      },
      feet: neo?.estimated_diameter?.feet && {
        estimated_diameter_min: +neo.estimated_diameter.feet.estimated_diameter_min || 0,
        estimated_diameter_max: +neo.estimated_diameter.feet.estimated_diameter_max || 0,
      },
    },
    is_potentially_hazardous_asteroid: Boolean(neo?.is_potentially_hazardous_asteroid),
    close_approach_data: Array.isArray(neo?.close_approach_data) ? neo.close_approach_data : [],
    is_sentry_object: Boolean(neo?.is_sentry_object),
  })

  /** --- Fetch NEO Data --- **/
  const fetchAsteroids = async () => {
    loading.value = true
    error.value = null

    try {
      const start = new Date().toISOString().slice(0, 10)
      const end = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

      const data = await fetchNeoData(start, end)
      const grouped = data?.near_earth_objects || {}
      const allItems = Object.values(grouped).flat() as any[]

      asteroids.value = allItems.map(mapNeoToAsteroid)
    } catch (err) {
      console.error('Error fetching asteroids:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch asteroids'
      asteroids.value = []
    } finally {
      loading.value = false
    }
  }

  /** --- Search Local Catalog --- **/
  const searchAsteroids = (query: string): Asteroid[] => {
    const q = query.trim().toLowerCase()
    if (!q && catalog.value.length > 0) {
      return catalog.value.map(m => ({
        links: { self: '' },
        id: m.id,
        neo_reference_id: m.id,
        name: m.name,
        nasa_jpl_url: '',
        absolute_magnitude_h: 0,
        estimated_diameter: {},
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [],
        is_sentry_object: false,
      }))
    }

    const filteredCatalog = catalog.value.filter(c =>
      c.name.toLowerCase().includes(q) || c.id.includes(q),
    )

    if (filteredCatalog.length > 0) {
      return filteredCatalog.map(m => ({
        links: { self: '' },
        id: m.id,
        neo_reference_id: m.id,
        name: m.name,
        nasa_jpl_url: '',
        absolute_magnitude_h: 0,
        estimated_diameter: {},
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [],
        is_sentry_object: false,
      }))
    }

    return asteroids.value.filter(a =>
      a.name.toLowerCase().includes(q) || a.id.includes(q),
    )
  }

  /** --- Fetch SBDB + NEO Details (Cached) --- **/
  const detailsCache = new Map<string, Asteroid>()

  const fetchDetailsForId = async (id: string): Promise<Asteroid | undefined> => {
    if (!id) return
    if (detailsCache.has(id)) return detailsCache.get(id)

    try {
      const sbdbResp = await fetchSmallBodyData(id)
      const obj = sbdbResp?.object || sbdbResp || {}
      const name = obj.full_name || obj.fullname || obj.designation || `ID ${id}`
      const physPar = sbdbResp?.phys_par || []

      const asteroid: Asteroid = {
        links: { self: obj.self || '' },
        id,
        neo_reference_id: id,
        name,
        nasa_jpl_url: obj.spk_url || obj.jpl_url || '',
        absolute_magnitude_h: Number(obj.H || 0),
        estimated_diameter: obj.diameter_km
          ? {
              kilometers: {
                estimated_diameter_min: Number(obj.diameter_km) * 0.9,
                estimated_diameter_max: Number(obj.diameter_km) * 1.1,
              },
            }
          : {},
        is_potentially_hazardous_asteroid: Boolean(obj.is_potentially_hazardous_asteroid),
        close_approach_data: [],
        is_sentry_object: false,
        tholen_spectral_type: physPar.find((p: any) => p.name === 'spec_T')?.value,
        smassii_spectral_type: physPar.find((p: any) => p.name === 'spec_B')?.value,
        diameter_km: Number(physPar.find((p: any) => p.name === 'diameter')?.value) || undefined,
        geometric_albedo: Number(physPar.find((p: any) => p.name === 'albedo')?.value) || undefined,
      }

      detailsCache.set(id, asteroid)

      const orbitClass = obj?.orbit?.class || ''
      const isNeoCandidate =
        obj.is_neo ||
        obj.is_potentially_hazardous_asteroid ||
        /near/i.test(orbitClass)

      if (isNeoCandidate) {
        try {
          const neoResp = await fetchNeoDetails(id)
          const mapped = mapNeoToAsteroid(neoResp)
          const enriched = {
            ...asteroid,
            ...mapped,
            estimated_diameter:
              Object.keys(mapped.estimated_diameter || {}).length > 0
                ? mapped.estimated_diameter
                : asteroid.estimated_diameter,
            absolute_magnitude_h: mapped.absolute_magnitude_h || asteroid.absolute_magnitude_h,
          }
          detailsCache.set(id, enriched)
          return enriched
        } catch {
          console.debug('No NEO details available for', id)
        }
      }

      return asteroid
    } catch (e) {
      console.warn('SBDB lookup failed for', id, e)
      return undefined
    }
  }

  return {
    asteroids,
    loading,
    error,
    catalog,
    fetchAsteroids,
    searchAsteroids,
    fetchDetailsForId,
  }
}