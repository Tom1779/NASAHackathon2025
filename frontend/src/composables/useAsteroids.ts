import { ref, type Ref } from 'vue'
import type { Asteroid } from '../types/asteroid'

export function useAsteroids() {
  const asteroids: Ref<Asteroid[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Mock data for development
  const mockAsteroids: Asteroid[] = [
    {
      links: {
        self: 'http://api.nasa.gov/neo/rest/v1/neo/2465633?api_key=DEMO_KEY',
      },
      id: '2465633',
      neo_reference_id: '2465633',
      name: '465633 (2009 JR5)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2465633',
      absolute_magnitude_h: 20.44,
      estimated_diameter: {
        kilometers: {
          estimated_diameter_min: 0.2170475943,
          estimated_diameter_max: 0.4853331752,
        },
        meters: {
          estimated_diameter_min: 217.0475943071,
          estimated_diameter_max: 485.3331752235,
        },
        miles: {
          estimated_diameter_min: 0.1348670807,
          estimated_diameter_max: 0.3015719604,
        },
        feet: {
          estimated_diameter_min: 712.0984293066,
          estimated_diameter_max: 1592.3004946003,
        },
      },
      is_potentially_hazardous_asteroid: true,
      close_approach_data: [
        {
          close_approach_date: '2015-09-08',
          close_approach_date_full: '2015-Sep-08 20:28',
          epoch_date_close_approach: 1441744080000,
          relative_velocity: {
            kilometers_per_second: '18.1279360862',
            kilometers_per_hour: '65260.5699103704',
            miles_per_hour: '40550.3802312521',
          },
          miss_distance: {
            astronomical: '0.3027469457',
            lunar: '117.7685618773',
            kilometers: '45290298.225725659',
            miles: '28142086.3515817342',
          },
          orbiting_body: 'Earth',
        },
      ],
      is_sentry_object: false,
    },
    {
      links: {
        self: 'http://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY',
      },
      id: '3542519',
      neo_reference_id: '3542519',
      name: 'Bennu (101955)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3542519',
      absolute_magnitude_h: 20.9,
      estimated_diameter: {
        kilometers: {
          estimated_diameter_min: 0.44,
          estimated_diameter_max: 0.492,
        },
        meters: {
          estimated_diameter_min: 440,
          estimated_diameter_max: 492,
        },
        miles: {
          estimated_diameter_min: 0.273,
          estimated_diameter_max: 0.305,
        },
        feet: {
          estimated_diameter_min: 1443,
          estimated_diameter_max: 1614,
        },
      },
      is_potentially_hazardous_asteroid: false,
      close_approach_data: [
        {
          close_approach_date: '2023-09-24',
          close_approach_date_full: '2023-Sep-24 18:11',
          epoch_date_close_approach: 1695573060000,
          relative_velocity: {
            kilometers_per_second: '27.7403',
            kilometers_per_hour: '99865.1',
            miles_per_hour: '62058.8',
          },
          miss_distance: {
            astronomical: '0.3225',
            lunar: '125.45',
            kilometers: '48250000',
            miles: '29980000',
          },
          orbiting_body: 'Earth',
        },
      ],
      is_sentry_object: false,
    },
    {
      links: {
        self: 'http://api.nasa.gov/neo/rest/v1/neo/2000433?api_key=DEMO_KEY',
      },
      id: '2000433',
      neo_reference_id: '2000433',
      name: '433 Eros',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2000433',
      absolute_magnitude_h: 11.16,
      estimated_diameter: {
        kilometers: {
          estimated_diameter_min: 16.84,
          estimated_diameter_max: 33.68,
        },
        meters: {
          estimated_diameter_min: 16840,
          estimated_diameter_max: 33680,
        },
        miles: {
          estimated_diameter_min: 10.46,
          estimated_diameter_max: 20.93,
        },
        feet: {
          estimated_diameter_min: 55249,
          estimated_diameter_max: 110499,
        },
      },
      is_potentially_hazardous_asteroid: false,
      close_approach_data: [],
      is_sentry_object: false,
    },
  ]

  const fetchAsteroids = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual NASA API call
      // const response = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${API_KEY}`)
      // const data = await response.json()
      // asteroids.value = data.near_earth_objects || []

      // For now, use mock data with simulated delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      asteroids.value = mockAsteroids
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch asteroids'
      console.error('Error fetching asteroids:', err)
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
