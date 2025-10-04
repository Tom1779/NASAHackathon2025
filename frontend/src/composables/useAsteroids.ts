import { ref, type Ref } from 'vue'
import type { Asteroid } from '../types/asteroid'
import { fetchNeoData } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'
// Load the SBDB query results CSV as raw text (Vite raw import)
import sbdbCsv from '../data/sbdb_query_results.csv?raw'
import { fetchNeoDetails } from '../api/neo'

export function useAsteroids() {
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Keep the mock dataset available as a safe fallback
  const mockAsteroids: Asteroid[] = [
    // lightweight fallback entries
    {
      links: { self: 'http://api.nasa.gov/neo/rest/v1/neo/2465633?api_key=DEMO_KEY' },
      id: '2465633',
      neo_reference_id: '2465633',
      name: '465633 (2009 JR5)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2465633',
      absolute_magnitude_h: 20.44,
      estimated_diameter: {},
      is_potentially_hazardous_asteroid: true,
      close_approach_data: [],
      is_sentry_object: false,
    },
    {
      links: { self: 'http://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY' },
      id: '3542519',
      neo_reference_id: '3542519',
      name: 'Bennu (101955)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3542519',
      absolute_magnitude_h: 20.9,
      estimated_diameter: {},
      is_potentially_hazardous_asteroid: false,
      close_approach_data: [],
      is_sentry_object: false,
    },
    {
      links: { self: 'http://api.nasa.gov/neo/rest/v1/neo/2000433?api_key=DEMO_KEY' },
      id: '2000433',
      neo_reference_id: '2000433',
      name: '433 Eros',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2000433',
      absolute_magnitude_h: 11.16,
      estimated_diameter: {},
      is_potentially_hazardous_asteroid: false,
      close_approach_data: [],
      is_sentry_object: false,
    },
  ]

  // Parse the SBDB CSV into a lightweight catalog of {id, name}
  const catalog = ref<{ id: string; name: string }[]>([])
  try {
    const text = (sbdbCsv as string) || ''
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    // header present, skip first line
    const rows = lines.slice(1)
    catalog.value = rows.map((r) => {
      // crude CSV parse: "spkid","full_name"
      const cols = r.split(',')
      const id = cols[0]?.replace(/"/g, '').trim() || ''
      // join remaining columns (in case name contains commas), remove surrounding quotes
      const name = cols.slice(1).join(',').replace(/"/g, '').trim() || ''
      return { id, name }
    }).filter((c) => c.id && c.name)
  } catch (e) {
    console.warn('Failed to parse sbdb CSV catalog', e)
    catalog.value = []
  }

  // Map NASA NEO object to our Asteroid type (best effort)
  const mapNeoToAsteroid = (neo: any): Asteroid => {
    // Convert any string numbers to actual numbers for diameter estimates
    const processedDiameter = neo?.estimated_diameter ? {
      kilometers: neo.estimated_diameter.kilometers ? {
        estimated_diameter_min: Number(neo.estimated_diameter.kilometers.estimated_diameter_min || 0),
        estimated_diameter_max: Number(neo.estimated_diameter.kilometers.estimated_diameter_max || 0)
      } : undefined,
      meters: neo.estimated_diameter.meters ? {
        estimated_diameter_min: Number(neo.estimated_diameter.meters.estimated_diameter_min || 0),
        estimated_diameter_max: Number(neo.estimated_diameter.meters.estimated_diameter_max || 0)
      } : undefined,
      feet: neo.estimated_diameter.feet ? {
        estimated_diameter_min: Number(neo.estimated_diameter.feet.estimated_diameter_min || 0),
        estimated_diameter_max: Number(neo.estimated_diameter.feet.estimated_diameter_max || 0)
      } : undefined
    } : {}

    return {
      links: { self: neo?.links?.self || '' },
      id: String(neo?.id || neo?.neo_reference_id || neo?.designation || ''),
      neo_reference_id: String(neo?.neo_reference_id || neo?.id || ''),
      name: neo?.name || neo?.full_name || neo?.designation || 'Unknown',
      nasa_jpl_url: neo?.nasa_jpl_url || '',
      absolute_magnitude_h: Number(neo?.absolute_magnitude_h || 0),
      estimated_diameter: processedDiameter,
      is_potentially_hazardous_asteroid: Boolean(neo?.is_potentially_hazardous_asteroid),
      close_approach_data: Array.isArray(neo?.close_approach_data) ? neo.close_approach_data : [],
      is_sentry_object: Boolean(neo?.is_sentry_object),
    }
  }

  const fetchAsteroids = async () => {
    loading.value = true
    error.value = null

    try {
      // Use a small date range to avoid large responses and rate limits
      const start = new Date()
      const end = new Date(start)
      end.setDate(start.getDate() + 1)
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)

      const data = await fetchNeoData(startStr, endStr)
      const grouped = data?.near_earth_objects
      const items: any[] = grouped ? Object.values(grouped).flat() : []
      const mapped: Asteroid[] = items.map(mapNeoToAsteroid)

      // Optionally enrich items with SBDB lookups if needed (disabled by default)
      // Example: fetchSmallBodyData(mapped[0].id)

      if (mapped.length > 0) {
        asteroids.value = mapped
      } else {
        // If no data returned, fallback to mock dataset
        asteroids.value = mockAsteroids
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch asteroids'
      console.error('Error fetching asteroids from NEO API, falling back to mock data:', err)
      asteroids.value = mockAsteroids
    } finally {
      loading.value = false
    }
  }

  const getAsteroidById = (id: string): Asteroid | undefined => {
    return asteroids.value.find((asteroid) => asteroid.id === id)
  }

  const searchAsteroids = (query: string): Asteroid[] => {
    const lowercaseQuery = query.trim().toLowerCase()

    // If the query is empty and we have the CSV catalog, return the full
    // catalog mapped to lightweight Asteroid objects so the selector shows
    // entries without any NEO calls.
    if (!lowercaseQuery) {
      if (catalog.value.length > 0) {
        return catalog.value.map((m) => ({
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
      return asteroids.value
    }

    // Non-empty query: prefer returning lightweight catalog matches (name + id)
    if (catalog.value.length > 0) {
      const matches = catalog.value.filter((c) => c.name.toLowerCase().includes(lowercaseQuery) || c.id.includes(lowercaseQuery))
      return matches.map((m) => ({
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

    return asteroids.value.filter(
      (asteroid) =>
        asteroid.name.toLowerCase().includes(lowercaseQuery) ||
        asteroid.id.includes(lowercaseQuery),
    )
  }

  // Fetch fuller details for a catalog ID using SBDB (preferred) or NEO details as a fallback
  // Simple in-memory cache to avoid repeated SBDB/NEO hits for the same id.
  const detailsCache = new Map<string, Asteroid>()

  const fetchDetailsForId = async (id: string): Promise<Asteroid | undefined> => {
    if (!id) return undefined

    // Return cached result if available
    if (detailsCache.has(id)) {
      return detailsCache.get(id)
    }

    try {
      // Primary lookup via SBDB
      const sbdbResp = await fetchSmallBodyData(id)
      const obj = sbdbResp?.object || sbdbResp || {}
      const name = obj?.full_name || obj?.fullname || obj?.fullName || obj?.designation || `ID ${id}`

      // Base asteroid object from SBDB
      let asteroid: Asteroid = {
        links: { self: obj?.self || '' },
        id: String(id),
        neo_reference_id: String(id),
        name,
        nasa_jpl_url: obj?.spk_url || obj?.jpl_url || '',
        absolute_magnitude_h: Number(obj?.H || obj?.magnitude_h || obj?.absolute_magnitude_h || 0),
        estimated_diameter: {
          kilometers: obj?.diameter_km ? {
            estimated_diameter_min: Number(obj?.diameter_km) * 0.9, // Estimate range as ±10%
            estimated_diameter_max: Number(obj?.diameter_km) * 1.1
          } : undefined,
          meters: obj?.diameter_km ? {
            estimated_diameter_min: Number(obj?.diameter_km) * 900, // Convert km to m
            estimated_diameter_max: Number(obj?.diameter_km) * 1100
          } : undefined,
          feet: obj?.diameter_km ? {
            estimated_diameter_min: Number(obj?.diameter_km) * 2952.76, // Convert km to feet
            estimated_diameter_max: Number(obj?.diameter_km) * 3608.92
          } : undefined
        },
        is_potentially_hazardous_asteroid: Boolean(obj?.is_potentially_hazardous_asteroid || false),
        close_approach_data: [],
        is_sentry_object: false,
      }

      // Cache SBDB-derived object immediately to prevent races
      detailsCache.set(id, asteroid)

      // Try to enrich with NEO details only when the SBDB response suggests
      // this object is a near-Earth object. Many SBDB entries are main-belt
      // asteroids and will return 404 from the NEO API. Avoid calling NEO for
      // unlikely candidates to reduce 404 noise and rate usage.
      const orbitClass = obj?.orbit?.class || obj?.orbit?.type || obj?.orbit_class
      const isNeoCandidate = Boolean(
        obj?.is_neo ||
        obj?.is_potentially_hazardous_asteroid ||
        (typeof orbitClass === 'string' && /near/i.test(orbitClass)) ||
        (String(obj?.full_name || obj?.designation || '').toLowerCase().includes('near earth'))
      )

      if (isNeoCandidate) {
        try {
          const neoResp = await fetchNeoDetails(String(id))
          try {
            const mapped = mapNeoToAsteroid(neoResp)
            // Merge fields from NEO response into our asteroid object, preferring NEO values
            // for diameter and magnitude when available
            asteroid = {
              ...asteroid,
              ...mapped,
              estimated_diameter: mapped.estimated_diameter && Object.keys(mapped.estimated_diameter).length > 0
                ? mapped.estimated_diameter 
                : asteroid.estimated_diameter,
              absolute_magnitude_h: mapped.absolute_magnitude_h || asteroid.absolute_magnitude_h
            }
            detailsCache.set(id, asteroid)
            console.log('NEO details (cached):', neoResp)
          } catch (e) {
            console.warn('Failed to map NEO response for', id, e)
          }
        } catch (e) {
          // NEO details may not exist for this id; that's expected for many
          // SBDB objects. We don't treat this as fatal.
          console.debug('NEO details not available for', id, e)
        }
      } else {
        console.debug('Skipping NEO details fetch for non-NEO candidate', id)
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
    fetchAsteroids,
    getAsteroidById,
    searchAsteroids,
    catalog,
    fetchDetailsForId,
  }
}
