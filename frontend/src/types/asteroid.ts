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
