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

  // Function to generate large mock dataset
  const generateLargeMockDataset = (): Asteroid[] => {
    const baseNames = [
      'Apophis', 'Bennu', 'Ryugu', 'Eros', 'Vesta', 'Ceres', 'Pallas', 'Juno',
      'Hygiea', 'Psyche', 'Lutetia', 'Mathilde', 'Gaspra', 'Ida', 'Dactyl',
      'Itokawa', 'Steins', 'Annefrank', 'Braille', 'Tempel', 'Hartley',
      'Wild', 'Borrelly', 'Halley', 'Encke', 'Giacobini', 'Grigg', 'Holmes',
      'Machholz', 'McNaught', 'NEOWISE', 'Hale-Bopp', 'Hyakutake', 'Levy',
      'Shoemaker', 'LINEAR', 'NEAT', 'Catalina', 'Spacewatch', 'LONEOS'
    ]
    
    const suffixes = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
    ]

    const yearCodes = ['2020', '2021', '2022', '2023', '2024', '2025']
    const monthCodes = ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL']

    const mockDataset: Asteroid[] = []
    
    // Generate 5000 asteroids for testing
    for (let i = 0; i < 5000; i++) {
      const baseName = baseNames[Math.floor(Math.random() * baseNames.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      const year = yearCodes[Math.floor(Math.random() * yearCodes.length)]
      const month = monthCodes[Math.floor(Math.random() * monthCodes.length)]
      const number = Math.floor(Math.random() * 999) + 1
      
      const id = `${1000000 + i}`
      const name = `${number} ${baseName} (${year} ${month}${suffix})`
      const magnitude = Math.random() * 30 + 10 // 10-40 range
      const isHazardous = Math.random() < 0.15 // 15% hazardous
      const diameter = Math.pow(10, (6.259 - 0.4 * magnitude)) // Approximate formula
      
      const asteroid: Asteroid = {
        links: {
          self: `http://api.nasa.gov/neo/rest/v1/neo/${id}?api_key=DEMO_KEY`,
        },
        id: id,
        neo_reference_id: id,
        name: name,
        nasa_jpl_url: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${id}`,
        absolute_magnitude_h: Math.round(magnitude * 100) / 100,
        estimated_diameter: {
          kilometers: {
            estimated_diameter_min: diameter * 0.8,
            estimated_diameter_max: diameter * 1.2,
          },
          meters: {
            estimated_diameter_min: diameter * 800,
            estimated_diameter_max: diameter * 1200,
          },
          miles: {
            estimated_diameter_min: diameter * 0.497,
            estimated_diameter_max: diameter * 0.746,
          },
          feet: {
            estimated_diameter_min: diameter * 2624,
            estimated_diameter_max: diameter * 3937,
          },
        },
        is_potentially_hazardous_asteroid: isHazardous,
        close_approach_data: [
          {
            close_approach_date: `${2025 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            close_approach_date_full: `${2025 + Math.floor(Math.random() * 5)}-Jan-01 12:00`,
            epoch_date_close_approach: Date.now() + Math.random() * 157788000000, // Random future date
            relative_velocity: {
              kilometers_per_second: (Math.random() * 30 + 5).toFixed(2),
              kilometers_per_hour: (Math.random() * 108000 + 18000).toFixed(2),
              miles_per_hour: (Math.random() * 67000 + 11000).toFixed(2),
            },
            miss_distance: {
              astronomical: (Math.random() * 2 + 0.1).toFixed(8),
              lunar: (Math.random() * 800 + 40).toFixed(8),
              kilometers: (Math.random() * 300000000 + 15000000).toFixed(2),
              miles: (Math.random() * 186000000 + 9300000).toFixed(2),
            },
            orbiting_body: 'Earth',
          },
        ],
        is_sentry_object: Math.random() < 0.02, // 2% sentry objects
      }
      
      mockDataset.push(asteroid)
    }
    
    // Add the original mock asteroids too
    return [...mockAsteroids, ...mockDataset]
  }

  const fetchAsteroids = async () => {
    loading.value = true
    error.value = null

    try {
      // Uncomment this when you have a real API endpoint
      // const response = await fetch('/api/asteroids')
      // const data = await response.json()
      // asteroids.value = data.near_earth_objects || []

      // For now, use large mock dataset with simulated delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      asteroids.value = generateLargeMockDataset()
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
