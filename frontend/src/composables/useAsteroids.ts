import { ref, type Ref } from 'vue'
import type { Asteroid } from '../types/asteroid'
import { fetchNeoData } from '../api/neo'
import { fetchSmallBodyData } from '../api/sbdb'

export function useAsteroids() {
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Keep the mock dataset available as a safe fallback
  const mockAsteroids: Asteroid[] = [
    // ...existing small mock list (kept for fallback) ...
  ]

  // Map NASA NEO object to our Asteroid type (best effort)
  const mapNeoToAsteroid = (neo: any): Asteroid => {
    return {
      links: { self: neo?.links?.self || '' },
      id: String(neo?.id || neo?.neo_reference_id || neo?.designation || ''),
      neo_reference_id: String(neo?.neo_reference_id || neo?.id || ''),
      name: neo?.name || neo?.full_name || neo?.designation || 'Unknown',
      nasa_jpl_url: neo?.nasa_jpl_url || '',
      absolute_magnitude_h: Number(neo?.absolute_magnitude_h || 0),
      estimated_diameter: neo?.estimated_diameter || {},
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
    if (!query.trim()) return asteroids.value

    const lowercaseQuery = query.toLowerCase()
    return asteroids.value.filter(
      (asteroid) =>
        asteroid.name.toLowerCase().includes(lowercaseQuery) ||
        asteroid.id.includes(lowercaseQuery),
    )
  }

  return {
    asteroids,
    loading,
    error,
    fetchAsteroids,
    getAsteroidById,
    searchAsteroids,
  }
}
