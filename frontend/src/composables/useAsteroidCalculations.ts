import { computed } from 'vue'
import type { Asteroid } from '../types/asteroid'
import { useComposition } from './useComposition'

// Current 2025 market prices with space delivery premiums
export const MARKET_PRICES = {
  gold: 124800,      // $2,000/oz * 31.1g/oz * 2 = $124,800/kg
  platinum: 51600,   // $1,650/oz * 31.1g/oz * 1.01 = $51,600/kg
  iron: 0.57,        // $570/tonne = $0.57/kg
  nickel: 35.2,      // $35,200/tonne = $35.2/kg
  cobalt: 92.4,      // $92,400/tonne = $92.4/kg
  water: 22,         // $22,000/tonne = $22/kg (space delivery cost)
  carbon: 2.2,       // $2,200/tonne = $2.2/kg
  silicates: 0.1,    // $100/tonne = $0.1/kg
  other: 50,         // Average for rare earth elements = $50/kg
  aluminum: 2.10,    // Added from your original set
  copper: 9.20,      // Added from your original set
  titanium: 35.00,   // Added from your original set
  magnesium: 3.50,   // Added from your original set
  hydrogen: 5.00,    // Added from your original set
  helium: 8.00,      // Added from your original set
  nitrogen: 0.35,    // Added from your original set
  oxygen: 0.50,      // Added from your original set
  sulfur: 0.25       // Added from your original set
}

// Asterank general constants
export const ASTERANK_GENERAL = {
  cost_to_orbit: 2200  // $ / kg
}

// Default values from Asterank scoring.py
export const ASTERANK_DEFAULTS = {
  DEFAULT_RADIUS: 0.5,    // km
  DEFAULT_MASS: 1.47e15,  // kg
  DEFAULT_MOID: 2,        // AU
  DEFAULT_DV: 12,         // km/s
  DEFAULT_ALBEDO: 0.15,   // albedo
  DEFAULT_DENSITY: 2      // g/cm³
}

// Asteroid density estimates by spectral type (kg/m³) - based on real measurements
export const DENSITY_BY_TYPE = {
  'C': 1200,  // Carbonaceous - Ryugu measured at ~1190 kg/m³
  'S': 2670,  // Stony - typical chondrite density
  'M': 5320,  // Metallic - iron-nickel density
  'V': 3440,  // Basaltic - HED meteorite density
  'Unknown': 2000  // Conservative average
}

// Mining and operational costs (per kg of material)
export const OPERATIONAL_COSTS = {
  extraction: 15,      // $15/kg - mining and processing
  transportation: 85,  // $85/kg - Earth to asteroid and return
  refining: 25,        // $25/kg - purification and processing
  overhead: 10         // $10/kg - mission overhead and profit margin
}

/**
 * Calculate asteroid diameter using H-magnitude when SBDB diameter unavailable
 * Formula: D = 1329 / √(A) × 10^(-0.2 × H)
 */
function calculateDiameterFromH(absoluteMagnitude: number, albedo: number = 0.25): number {
  if (!absoluteMagnitude || absoluteMagnitude === 0) return 1.2 // Default fallback
  
  // Asterank formula for diameter calculation
  const diameter = 1329 / Math.sqrt(albedo) * Math.pow(10, -0.2 * absoluteMagnitude)
  return Math.max(0.1, diameter) // Ensure positive diameter with minimum 100m
}

/**
 * Get asteroid diameter in kilometers with smart fallback logic
 */
function getAsteroidDiameter(asteroid: Asteroid): number {
  try {
    // Priority 1: SBDB diameter data
    if (asteroid.diameter_km && asteroid.diameter_km > 0 && isFinite(asteroid.diameter_km)) {
      return Math.max(0.01, asteroid.diameter_km) // Minimum 10m diameter
    }
    
    // Priority 2: NASA estimated diameter (average min/max)
    const estDiam = asteroid.estimated_diameter?.kilometers
    if (estDiam?.estimated_diameter_min && estDiam?.estimated_diameter_max) {
      const min = Number(estDiam.estimated_diameter_min)
      const max = Number(estDiam.estimated_diameter_max)
      if (min > 0 && max > 0 && isFinite(min) && isFinite(max)) {
        const avg = (min + max) / 2
        return Math.max(0.01, avg) // Minimum 10m diameter
      }
    }
    
    // Priority 3: Calculate from H-magnitude
    if (asteroid.absolute_magnitude_h && asteroid.absolute_magnitude_h > 0 && isFinite(asteroid.absolute_magnitude_h)) {
      const albedo = asteroid.geometric_albedo || 0.25 // Default albedo
      if (albedo > 0 && isFinite(albedo)) {
        return calculateDiameterFromH(asteroid.absolute_magnitude_h, albedo)
      }
    }
    
    // Fallback: Default diameter
    return 1.2 // 1.2 km default
  } catch (error) {
    console.warn('Error calculating asteroid diameter:', error)
    return 1.2 // Safe fallback
  }
}

/**
 * Get density based on asteroid composition (Asterank methodology)
 */
function getAsteroidDensity(asteroid: Asteroid): number {
  const composition = useComposition(asteroid)
  const spectralType = composition.spectralType.value
  
  // Get density based on primary spectral type (g/cm³)
  if (spectralType && spectralType !== 'Unknown') {
    const primaryType = spectralType.charAt(0).toUpperCase()
    return DENSITY_BY_TYPE[primaryType as keyof typeof DENSITY_BY_TYPE] || DENSITY_BY_TYPE.Unknown
  }
  
  return DENSITY_BY_TYPE.Unknown
}

/**
 * Calculate asteroid mass using Asterank methodology
 */
function calculateAsterankMass(asteroid: Asteroid): number {
  const G = 6.67300e-20 // km³ / kg·s² (Asterank constant)
  
  console.log('🔍 MASS CALCULATION START for:', asteroid.name)
  
  // Try to use exact mass from GM if available
  if (asteroid.GM && typeof asteroid.GM === 'number' && asteroid.GM > 0) {
    let mass = asteroid.GM / G
    console.log('📊 Using GM method: GM =', asteroid.GM, 'mass =', mass, 'kg')
    
    // Asterank penalty for huge asteroids
    if (mass > 1e18) {
      mass = mass * 1e-6
      console.log('⚠️ Applied huge asteroid penalty, new mass =', mass, 'kg')
    }
    
    return mass
  }
  
  // Estimate mass from diameter and density
  const diameter = getAsteroidDiameter(asteroid)
  console.log('📏 Diameter calculation:', diameter, 'km')
  
  if (diameter > 0) {
    const composition = useComposition(asteroid)
    const spectralType = composition.spectralType.value
    const primaryType = spectralType?.charAt(0).toUpperCase() || 'C'
    
    let assumedDensity = DENSITY_BY_TYPE[primaryType as keyof typeof DENSITY_BY_TYPE] || ASTERANK_DEFAULTS.DEFAULT_DENSITY
    console.log('🏗️ Spectral type:', spectralType, '→ Primary type:', primaryType, '→ Density:', assumedDensity, 'kg/m³')
    
    // Volume in km³
    const assumedVol = (4/3) * Math.PI * Math.pow(diameter / 2, 3)
    console.log('📊 Volume calculation: (4/3)π × (' + diameter + '/2)³ =', assumedVol, 'km³')
    
    // Mass calculation: volume (km³) × density (kg/m³) → kg
    // Volume in km³ = (4/3)πr³, convert to m³ by × 1e9, then × density
    const mass = assumedVol * 1e9 * assumedDensity
    console.log('⚖️ Mass = volume × 1e9 × density =', assumedVol, '× 1e9 ×', assumedDensity, '=', mass, 'kg')
    console.log('📈 Final mass:', (mass / 1e9).toFixed(2), 'billion kg =', (mass / 1e12).toFixed(2), 'trillion kg')
    
    return mass
  }
  
  // Fallback to default mass with random factor
  return ASTERANK_DEFAULTS.DEFAULT_MASS + (Math.random() - 0.5) * 1e14
}

/**
 * Calculate value per kg for spectral type (Asterank methodology)
 */
function asterankValuePerKg(spectralType: string): number {
  const composition = useComposition({ 
    tholen_spectral_type: spectralType,
    smassii_spectral_type: spectralType 
  } as Asteroid)
  
  let valuePerKg = 0
  
  if (composition.materials.value) {
    for (const material of composition.materials.value) {
      const materialName = material.material
      const percentage = Number(material.percentage) / 100
      const pricePerKg = MARKET_PRICES[materialName as keyof typeof MARKET_PRICES] || 0
      valuePerKg += pricePerKg * percentage
    }
  }
  
  return valuePerKg
}

/**
 * Asterank closeness weight calculation
 */
function asterankClosenessWeight(asteroid: Asteroid): number {
  const DEFAULT_MOID = ASTERANK_DEFAULTS.DEFAULT_MOID
  const DEFAULT_DV = ASTERANK_DEFAULTS.DEFAULT_DV
  
  // Get MOID (Minimum Orbit Intersection Distance)
  const moid = asteroid.moid || DEFAULT_MOID
  
  // Penalize aphelion distance
  const aph = asteroid.aphelion_distance || asteroid.q || 1.5
  if (aph > 50) return -1
  const aphScore = 1 / (1 + Math.exp(0.9 * aph))
  
  // Major axis score
  const majorAxis = asteroid.semi_major_axis || asteroid.a || 1.2
  const maScore = 1 / (1 + Math.exp(0.45 * majorAxis))
  
  // Perihelion score
  const ph = asteroid.perihelion_distance || asteroid.q || 1.0
  const phScore = 1 / (1 + Math.exp(0.9 * ph))
  
  // Delta-v score (assuming we have this or use default)
  const dv = asteroid.delta_v || DEFAULT_DV
  const dvScore = 1 + (1 / (1 + Math.exp(1.3 * dv - 6)))
  
  return Math.pow(aphScore + maScore + phScore + 50 * dvScore + 1, 2)
}

/**
 * Asterank profit calculation
 */
function asterankProfit(price: number, closeness: number, deltaV?: number): number {
  const DEFAULT_DV = ASTERANK_DEFAULTS.DEFAULT_DV
  const myDv = deltaV || DEFAULT_DV
  
  // Asterank profit formula: price / 12 * closeness / 3417.5490736698116 * profitRatio(DEFAULT_DV, myDv)
  const profitRatio = DEFAULT_DV / myDv  // baseline profit is 10%, changes based on dv
  
  return (price / 12) * (closeness / 3417.5490736698116) * profitRatio
}

/**
 * Calculate total operational cost per kg
 */
function getTotalCostPerKg(): number {
  return Object.values(OPERATIONAL_COSTS).reduce((sum, cost) => sum + cost, 0)
}

/**
 * Format large numbers with appropriate units
 */
function formatValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

/**
 * Format mass with appropriate units
 */
function formatMass(kg: number): string {
  if (kg >= 1e12) return `${(kg / 1e12).toFixed(2)} Tt` // Teratonnes
  if (kg >= 1e9) return `${(kg / 1e9).toFixed(2)} Gt`   // Gigatonnes
  if (kg >= 1e6) return `${(kg / 1e6).toFixed(2)} Mt`   // Megatonnes
  if (kg >= 1e3) return `${(kg / 1e3).toFixed(2)} kt`   // Kilotonnes
  return `${kg.toFixed(0)} kg`
}

/**
 * Main composable for asteroid value calculations (Asterank methodology)
 */
export function useAsteroidCalculations(asteroid: Asteroid) {
  console.log('🚀 STARTING ASTEROID CALCULATIONS for:', asteroid.name)
  console.log('📋 Asteroid data:', {
    id: asteroid.id,
    absoluteMagnitude: asteroid.absolute_magnitude_h,
    estimatedDiameter: asteroid.estimated_diameter?.kilometers,
    sbdbDiameter: asteroid.diameter_km,
    spectralType: asteroid.tholen_spectral_type || asteroid.smassii_spectral_type
  })
  
  const composition = useComposition(asteroid)
  
  // Basic physical properties
  const diameter = computed(() => getAsteroidDiameter(asteroid))
  const density = computed(() => getAsteroidDensity(asteroid))
  
  // Asterank mass calculation (more sophisticated than volume × density)
  const totalMass = computed(() => {
    const mass = calculateAsterankMass(asteroid)
    console.log('⚖️ FINAL TOTAL MASS:', (mass / 1e9).toFixed(2), 'billion kg')
    return mass
  })
  
  // Volume calculation for display purposes
  const volume = computed(() => {
    // Volume of sphere: (4/3) * π * r³
    const radius = diameter.value / 2 // Convert to radius in km
    const radiusM = radius * 1000 // Convert to meters
    return (4/3) * Math.PI * Math.pow(radiusM, 3) // Volume in m³
  })
  
  // Asterank price calculation
  const asterankPrice = computed(() => {
    const spectralType = composition.spectralType.value || 'C'
    const mass = totalMass.value
    const valuePerKg = asterankValuePerKg(spectralType)
    const totalValue = valuePerKg * mass
    
    console.log('💰 PRICE CALCULATION:')
    console.log('  Spectral type:', spectralType)
    console.log('  Mass:', (mass / 1e9).toFixed(2), 'billion kg')
    console.log('  Value per kg:', '$' + valuePerKg.toFixed(2))
    console.log('  Total value:', formatValue(totalValue))
    
    return totalValue
  })
  
  // Asterank closeness weight
  const closenessWeight = computed(() => asterankClosenessWeight(asteroid))
  
  // Asterank profit calculation
  const asterankProfitValue = computed(() => {
    const profit = asterankProfit(asterankPrice.value, closenessWeight.value, asteroid.delta_v)
    console.log('📈 PROFIT CALCULATION:', formatValue(profit))
    return profit
  })
  
  // Asterank final score (their ranking algorithm)
  const asterankScore = computed(() => {
    const price = asterankPrice.value
    const closeness = closenessWeight.value
    
    // Cap price influence at 10B
    let score = Math.min(price, 1e10) / 5e11
    if (score > 0.0001) {
      score = score + closeness / 20
    }
    return score
  })
  
  // Material calculations using Asterank methodology
  const materials = computed(() => {
    if (!composition.materials.value || totalMass.value <= 0) return []
    
    try {
      console.log('🧪 MATERIAL COMPOSITION ANALYSIS:')
      
      return composition.materials.value
        .map(material => {
          const percentage = Number(material.percentage) / 100
          
          // Validate percentage
          if (!isFinite(percentage) || percentage < 0 || percentage > 1) {
            console.warn(`Invalid percentage for material ${material.material}:`, material.percentage)
            return null
          }
          
          const mass = totalMass.value * percentage
          console.log(`  ${material.material}: ${(percentage * 100).toFixed(3)}% = ${(mass / 1e9).toFixed(2)}B kg`)
          const pricePerKg = MARKET_PRICES[material.material as keyof typeof MARKET_PRICES] || 0
          const grossValue = mass * pricePerKg
          
          // Asterank's "saved" calculation vs launching from Earth
          const savedPerKg = ASTERANK_GENERAL.cost_to_orbit * percentage
          const totalSaved = mass * (savedPerKg - (ASTERANK_GENERAL.cost_to_orbit / 3))
          
          // Asterank uses very high operational costs (99.999% of revenue)
          const totalCosts = grossValue * 0.99999
          const netProfit = grossValue - totalCosts
          
          // Validate all calculations
          if (!isFinite(mass) || !isFinite(grossValue) || !isFinite(totalCosts) || !isFinite(netProfit)) {
            console.warn(`Invalid calculation for material ${material.material}`)
            return null
          }
        
        return {
          ...material,
          mass,
          pricePerKg,
          grossValue,
          totalSaved,
          totalCosts,
          netProfit,
          profitMargin: grossValue > 0 ? (netProfit / grossValue) * 100 : -100
        }
      }).filter(Boolean) // Remove null entries
    } catch (error) {
      console.error('Error calculating materials:', error)
      return []
    }
  })
  
  // Total values
  const totalGrossValue = computed(() => {
    return materials.value.reduce((sum, material) => material ? sum + material.grossValue : sum, 0)
  })
  
  const totalCosts = computed(() => {
    return materials.value.reduce((sum, material) => material ? sum + material.totalCosts : sum, 0)
  })
  
  const totalNetProfit = computed(() => {
    return totalGrossValue.value - totalCosts.value
  })
  
  const profitMargin = computed(() => {
    return totalGrossValue.value > 0 ? (totalNetProfit.value / totalGrossValue.value) * 100 : -100
  })
  
  // Economic viability assessment
  const isViable = computed(() => totalNetProfit.value > 0)
  const viabilityRating = computed(() => {
    if (profitMargin.value < 0) return 'Not Viable'
    if (profitMargin.value < 10) return 'Marginal'
    if (profitMargin.value < 50) return 'Viable'
    if (profitMargin.value < 100) return 'Highly Viable'
    return 'Extremely Viable'
  })
  
  // Top valuable materials (sorted by net profit)
  const topMaterials = computed(() => {
    return materials.value
      .filter((m): m is NonNullable<typeof m> => m !== null && m.netProfit > 0)
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5) // Top 5 most profitable materials
  })
  
  // Mission summary
  const missionSummary = computed(() => ({
    diameter: diameter.value,
    mass: totalMass.value,
    density: density.value,
    grossValue: totalGrossValue.value,
    totalCosts: totalCosts.value,
    netProfit: totalNetProfit.value,
    profitMargin: profitMargin.value,
    isViable: isViable.value,
    viabilityRating: viabilityRating.value,
    paybackTime: totalCosts.value > 0 ? totalNetProfit.value / (totalCosts.value * 0.1) : 0, // Rough payback estimate
    riskLevel: profitMargin.value > 50 ? 'Low' : profitMargin.value > 10 ? 'Medium' : 'High'
  }))
  
  return {
    // Physical properties
    diameter,
    density, 
    volume,
    totalMass,
    
    // Asterank calculations
    asterankPrice,
    closenessWeight,
    asterankProfitValue,
    asterankScore,
    
    // Material breakdown
    materials,
    topMaterials,
    
    // Financial calculations (legacy for compatibility)
    totalGrossValue,
    totalCosts,
    totalNetProfit,
    profitMargin,
    
    // Viability assessment (now based on Asterank profit)
    isViable: computed(() => asterankProfitValue.value > 0),
    viabilityRating: computed(() => {
      const profit = asterankProfitValue.value
      if (profit <= 0) return 'Not Viable'
      if (profit < 1e6) return 'Marginal'
      if (profit < 1e9) return 'Viable'  
      if (profit < 1e12) return 'Highly Viable'
      return 'Extremely Viable'
    }),
    missionSummary: computed(() => ({
      diameter: diameter.value,
      mass: totalMass.value,
      density: density.value,
      asterankPrice: asterankPrice.value,
      asterankProfit: asterankProfitValue.value,
      asterankScore: asterankScore.value,
      closenessWeight: closenessWeight.value,
      grossValue: totalGrossValue.value, // Legacy
      totalCosts: totalCosts.value, // Legacy
      netProfit: totalNetProfit.value, // Legacy
      profitMargin: profitMargin.value, // Legacy
      isViable: asterankProfitValue.value > 0,
      viabilityRating: asterankProfitValue.value > 1e12 ? 'Extremely Viable' : 
                      asterankProfitValue.value > 1e9 ? 'Highly Viable' :
                      asterankProfitValue.value > 1e6 ? 'Viable' :
                      asterankProfitValue.value > 0 ? 'Marginal' : 'Not Viable',
      paybackTime: 0, // Not part of Asterank methodology
      riskLevel: closenessWeight.value > 1000 ? 'Low' : 
                 closenessWeight.value > 100 ? 'Medium' : 'High'
    })),
    
    // Utility functions
    formatValue,
    formatMass
  }
}