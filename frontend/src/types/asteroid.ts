export interface EstimatedDiameter {
  kilometers?: {
    estimated_diameter_min: number
    estimated_diameter_max: number
  }
  meters?: {
    estimated_diameter_min: number
    estimated_diameter_max: number
  }
  miles?: {
    estimated_diameter_min: number
    estimated_diameter_max: number
  }
  feet?: {
    estimated_diameter_min: number
    estimated_diameter_max: number
  }
}

export interface RelativeVelocity {
  kilometers_per_second: string
  kilometers_per_hour: string
  miles_per_hour: string
}

export interface MissDistance {
  astronomical: string
  lunar: string
  kilometers: string
  miles: string
}

export interface CloseApproachData {
  close_approach_date: string
  close_approach_date_full: string
  epoch_date_close_approach: number
  relative_velocity: RelativeVelocity
  miss_distance: MissDistance
  orbiting_body: string
}

export interface AsteroidLinks {
  self: string
}

export interface Asteroid {
  links: AsteroidLinks
  id: string
  neo_reference_id: string
  name: string
  nasa_jpl_url: string
  absolute_magnitude_h: number
  estimated_diameter: EstimatedDiameter
  is_potentially_hazardous_asteroid: boolean
  close_approach_data: CloseApproachData[]
  is_sentry_object: boolean
  // Composition data from SBDB
  tholen_spectral_type?: string // Tholen spectral classification (C, S, M, etc.)
  smassii_spectral_type?: string // SMASSII spectral classification
  diameter_km?: number // Diameter from SBDB in kilometers
  geometric_albedo?: number // Geometric albedo from SBDB
  
  // Additional orbital and physical properties for Asterank calculations
  GM?: number // Gravitational parameter (km³/s²)
  moid?: number // Minimum Orbit Intersection Distance (AU)
  aphelion_distance?: number // Aphelion distance (AU)
  perihelion_distance?: number // Perihelion distance (AU)
  semi_major_axis?: number // Semi-major axis (AU)
  delta_v?: number // Delta-v for mission (km/s)
  a?: number // Semi-major axis (alternate property)
  q?: number // Perihelion distance (alternate property)
}

export interface AsteroidComposition {
  // This will be expanded when you integrate with the composition API
  metals?: {
    iron?: number
    nickel?: number
    platinum?: number
    gold?: number
    [key: string]: number | undefined
  }
  minerals?: {
    [key: string]: number
  }
  estimated_value_usd?: number
}

export interface OrbitalData {
  // Semi-major axis (AU)
  a: number
  // Eccentricity
  e: number
  // Inclination (degrees)
  i: number
  // Longitude of ascending node (degrees)
  om: number
  // Argument of perihelion (degrees)
  w: number
  // Mean anomaly (degrees)
  ma: number
  // Epoch (Julian Date)
  epoch?: number
  // Orbital period (days)
  period?: number
}

export interface SbdbData {
  object: {
    fullname: string
    des: string
    orbit_id: string
    [key: string]: unknown
  }
  orbit?: {
    elements?: Array<{ name: string; value: string }>
    element_labels?: string[]
    element_values?: string[]
    epoch?: string
    [key: string]: unknown
  }
  phys_par?: {
    [key: string]: unknown
  }
}
