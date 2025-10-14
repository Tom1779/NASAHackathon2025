# Asteroid Valuation Process Documentation

## Overview
This document describes our current asteroid economic valuation process, from raw NASA data acquisition through final profitability estimates. The system implements the **Asterank methodology** with **2025 market pricing** to provide realistic asteroid mining economics.

---

## 1. Data Acquisition Phase

### Input Sources
The system accepts asteroid data from multiple NASA sources:

```typescript
// Primary data sources processed:
interface Asteroid {
  // Identification
  id: string
  name: string
  
  // Physical Properties
  absolute_magnitude_h?: number        // H-magnitude for size estimation
  diameter_km?: number                 // Direct SBDB diameter (preferred)
  estimated_diameter?: {               // NASA estimated diameter range
    kilometers: {
      estimated_diameter_min: number
      estimated_diameter_max: number  
    }
  }
  geometric_albedo?: number           // Surface reflectivity
  
  // Composition Indicators  
  tholen_spectral_type?: string       // Tholen classification system
  smassii_spectral_type?: string      // SMASS-II classification system
  
  // Orbital Mechanics
  GM?: number                         // Gravitational parameter (mass indicator)
  semi_major_axis?: number            // Orbital distance (AU)
  moid?: number                       // Minimum orbital intersection distance
  delta_v?: number                    // Velocity change required for rendezvous
  aphelion_distance?: number          // Farthest point from Sun
  perihelion_distance?: number        // Closest point to Sun
}
```

### Data Quality Assessment
```typescript
// The system handles missing/invalid data with intelligent fallbacks:
function getAsteroidDiameter(asteroid: Asteroid): number {
  // Priority 1: Direct SBDB measurement (most reliable)
  if (asteroid.diameter_km && asteroid.diameter_km > 0) {
    return asteroid.diameter_km
  }
  
  // Priority 2: NASA estimated diameter (average of min/max)
  if (asteroid.estimated_diameter?.kilometers) {
    const min = asteroid.estimated_diameter.kilometers.estimated_diameter_min
    const max = asteroid.estimated_diameter.kilometers.estimated_diameter_max
    return (min + max) / 2
  }
  
  // Priority 3: Calculate from H-magnitude using Asterank formula
  if (asteroid.absolute_magnitude_h) {
    const albedo = asteroid.geometric_albedo || 0.25 // Default albedo
    return 1329 / Math.sqrt(albedo) * Math.pow(10, -0.2 * asteroid.absolute_magnitude_h)
  }
  
  // Fallback: Conservative 1.2 km diameter
  return 1.2
}
```

---

## 2. Composition Analysis Phase

### Spectral Type Classification
The system maps spectral types to material compositions using scientific literature:

```typescript
// Based on Bus & Binzel (2002), Tholen (1984), DeMeo et al. (2009)
export const ASTEROID_COMPOSITIONS = {
  'C': { // Carbonaceous (~75% of asteroids)
    iron: 10,       // Low metal content
    nickel: 4,      // Associated with iron  
    cobalt: 2,      // Industrial metal
    water: 20,      // High water content (hydrated minerals)
    carbon: 35,     // High carbon content
    silicates: 25,  // Rocky material
    other: 4        // Trace materials
  },
  
  'S': { // Stony (~17% of asteroids)
    iron: 25,       // Moderate metals
    nickel: 12,     
    cobalt: 3,
    water: 5,       // Low water
    carbon: 2,      // Low carbon
    silicates: 50,  // High silicates
    other: 3
  },
  
  'M': { // Metallic (~8% of asteroids)  
    iron: 45,       // High metal content
    nickel: 35,     // High nickel
    platinum: 0.05, // PGE content (only M-type has precious metals)
    gold: 0.02,     // Precious metals
    cobalt: 5,      // Higher industrial metals
    water: 0,       // No water
    carbon: 0,      // No carbon  
    silicates: 10,  // Low silicates
    other: 4.88
  }
}
```

### Spectral Type Processing
```typescript
function determineSpectralType(asteroid: Asteroid): string {
  // Priority: Tholen > SMASSII > Unknown
  const spectralType = asteroid.tholen_spectral_type || asteroid.smassii_spectral_type
  
  if (spectralType) {
    // Extract main class (handle subtypes like "Ch", "Sq", etc.)
    const mainClass = spectralType.charAt(0).toUpperCase()
    return ['C', 'S', 'M', 'V'].includes(mainClass) ? mainClass : 'Unknown'
  }
  
  return 'Unknown' // Default to average composition
}
```

---

## 3. Mass Calculation Phase

### Asterank Mass Methodology
The system implements Asterank's sophisticated mass calculation approach:

```typescript
function calculateAsterankMass(asteroid: Asteroid): number {
  const G = 6.67300e-20 // Asterank gravitational constant (km³/kg·s²)
  
  // Method 1: Direct from gravitational parameter (most accurate)
  if (asteroid.GM && asteroid.GM > 0) {
    let mass = asteroid.GM / G
    
    // Asterank penalty for huge asteroids (surface covered in ejecta)
    if (mass > 1e18) {
      mass = mass * 1e-6 // Reduce by million-fold for accessibility
    }
    
    return mass
  }
  
  // Method 2: Estimate from diameter and spectral-type density
  const diameter = getAsteroidDiameter(asteroid) // km
  const spectralType = determineSpectralType(asteroid)
  
  // Density by spectral type (kg/m³) - based on measurements
  const DENSITY_BY_TYPE = {
    'C': 1200,  // Carbonaceous - Ryugu measured at ~1190 kg/m³
    'S': 2670,  // Stony - typical chondrite density  
    'M': 5320,  // Metallic - iron-nickel density
    'V': 3440,  // Basaltic - HED meteorite density
    'Unknown': 2000
  }
  
  const density = DENSITY_BY_TYPE[spectralType]
  
  // Volume calculation: (4/3)πr³
  const volume_km3 = (4/3) * Math.PI * Math.pow(diameter / 2, 3)
  
  // Convert to mass: volume(km³) × 1e9(m³/km³) × density(kg/m³) 
  const mass = volume_km3 * 1e9 * density
  
  return mass
}
```

---

## 4. Economic Valuation Phase

### 2025 Market Pricing Model
Current space delivery economics with realistic operational costs:

```typescript
export const MARKET_PRICES = {
  // Precious Metals (space delivery premium)
  gold: 124800,      // $124,800/kg ($2,000/oz × 31.1g/oz × 2 space premium)
  platinum: 51600,   // $51,600/kg ($1,650/oz × 31.1g/oz × 1.01 premium)
  
  // Industrial Metals (processed space delivery costs)
  iron: 0.57,        // $0.57/kg ($570/tonne space processed)
  nickel: 35.2,      // $35.2/kg ($35,200/tonne space processed)  
  cobalt: 92.4,      // $92.4/kg ($92,400/tonne space processed)
  
  // Essential Resources (space delivery critical)
  water: 22,         // $22/kg ($22,000/tonne space delivery cost)
  hydrogen: 5.00,    // $5/kg (fuel production)
  oxygen: 0.50,      // $0.50/kg (life support)
  
  // Construction Materials
  carbon: 2.2,       // $2.2/kg (structural carbon)
  silicates: 0.1,    // $0.1/kg (construction aggregate)
  aluminum: 2.10,    // $2.10/kg
  titanium: 35.00,   // $35/kg (aerospace grade)
  
  // Other strategic materials...
}
```

### Asterank Value Calculation
```typescript
function asterankValuePerKg(spectralType: string): number {
  const composition = getComposition(spectralType)
  let valuePerKg = 0
  
  // Sum weighted material values
  for (const material of composition) {
    const percentage = material.percentage / 100
    const pricePerKg = MARKET_PRICES[material.name] || 0
    valuePerKg += pricePerKg * percentage
  }
  
  return valuePerKg
}

// Total asteroid value
const asterankPrice = mass × valuePerKg
```

---

## 5. Accessibility Analysis Phase

### Asterank Closeness Weight Algorithm
Evaluates mining accessibility based on orbital mechanics:

```typescript
function asterankClosenessWeight(asteroid: Asteroid): number {
  // MOID (Minimum Orbit Intersection Distance) - closer is better
  const moid = asteroid.moid || 2.0 // AU, default 2 AU
  
  // Aphelion penalty (objects that go too far from Sun are harder to reach)
  const aphelion = asteroid.aphelion_distance || 1.5
  if (aphelion > 50) return -1 // Reject objects going beyond Jupiter
  const aphScore = 1 / (1 + Math.exp(0.9 * aphelion))
  
  // Semi-major axis score (orbit size)
  const semiMajorAxis = asteroid.semi_major_axis || 1.2
  const maScore = 1 / (1 + Math.exp(0.45 * semiMajorAxis))
  
  // Perihelion score (closest approach to Sun)
  const perihelion = asteroid.perihelion_distance || 1.0  
  const phScore = 1 / (1 + Math.exp(0.9 * perihelion))
  
  // Delta-V score (velocity change needed for rendezvous)
  const deltaV = asteroid.delta_v || 12 // km/s, default 12 km/s
  const dvScore = 1 + (1 / (1 + Math.exp(1.3 * deltaV - 6)))
  
  // Combined weighted accessibility score
  return Math.pow(aphScore + maScore + phScore + 50 * dvScore + 1, 2)
}
```

---

## 6. Profitability Assessment Phase

### Asterank Profit Formula
The final economic viability calculation:

```typescript
function asterankProfit(price: number, closeness: number, deltaV?: number): number {
  const DEFAULT_DV = 12 // km/s baseline
  const actualDV = deltaV || DEFAULT_DV
  
  // Asterank profit formula components:
  // 1. Price factor (total asteroid value)
  // 2. Accessibility factor (closeness weight / normalization constant) 
  // 3. Mission efficiency (baseline deltaV / actual deltaV)
  
  const profitRatio = DEFAULT_DV / actualDV // Efficiency multiplier
  const normalizedCloseness = closeness / 3417.5490736698116 // Asterank constant
  const baseProfit = price / 12 // Base profit assumption
  
  return baseProfit × normalizedCloseness × profitRatio
}
```

### Asterank Scoring System
```typescript
function calculateAsterankScore(price: number, closeness: number): number {
  // Cap price influence at $10B to prevent extreme outliers
  let score = Math.min(price, 1e10) / 5e11
  
  // Add accessibility bonus for viable targets
  if (score > 0.0001) {
    score = score + closeness / 20
  }
  
  return score // Higher score = more attractive target
}
```

---

## 7. Material Breakdown Analysis

### Individual Material Economics
For each material in the asteroid composition:

```typescript
function calculateMaterialValue(material: Material, totalMass: number) {
  const percentage = material.percentage / 100
  const materialMass = totalMass × percentage
  const pricePerKg = MARKET_PRICES[material.name] || 0
  
  return {
    name: material.name,
    percentage: material.percentage,
    mass: materialMass, // kg
    pricePerKg: pricePerKg,
    grossValue: materialMass × pricePerKg,
    
    // Asterank "saved cost" vs Earth launch
    savedPerKg: 2200 × percentage, // $2,200/kg Earth launch cost
    totalSaved: materialMass × (savedPerKg - (2200 / 3)), // Assume 1/3 cost to mine
    
    // Operational costs (Asterank uses 99.999% of revenue)
    operationalCosts: grossValue × 0.99999,
    netProfit: grossValue - (grossValue × 0.99999),
    profitMargin: ((netProfit / grossValue) × 100) || 0
  }
}
```

---

## 8. Final Output Generation

### Comprehensive Results Object
```typescript
interface AsteroidValuationResults {
  // Physical Properties
  diameter: number          // km
  mass: number             // kg  
  density: number          // kg/m³
  volume: number           // m³
  
  // Asterank Core Metrics
  asterankPrice: number    // Total asteroid value ($)
  closenessWeight: number  // Accessibility score
  asterankProfit: number  // Profitability estimate ($)
  asterankScore: number   // Overall ranking score
  
  // Material Breakdown
  materials: MaterialValue[] // Individual material economics
  topMaterials: MaterialValue[] // Most profitable materials (top 5)
  
  // Economic Summary
  totalGrossValue: number  // Sum of all material values
  totalNetProfit: number   // After operational costs
  profitMargin: number     // Percentage profit margin
  
  // Viability Assessment
  isViable: boolean        // asterankProfit > 0
  viabilityRating: string  // "Not Viable" to "Extremely Viable"
  riskLevel: string        // Based on closenessWeight
  
  // Mission Summary
  missionSummary: {
    diameter: number
    mass: number
    asterankPrice: number
    asterankProfit: number
    asterankScore: number
    isViable: boolean
    viabilityRating: string
    riskLevel: string
  }
}
```

---

## 9. Key Differences from Asterank 2012

### Pricing Model Updates
| Component | Asterank 2012 | Our System 2025 | Ratio |
|-----------|---------------|-----------------|--------|
| Water | $0.01/kg | $22/kg | 2,200x |
| Iron | $0.0000002/kg | $0.57/kg | 2.85M x |
| Nickel | $0.00002/kg | $35.2/kg | 1.76M x |
| Cobalt | $0.20/kg | $92.4/kg | 462x |

### Methodology Improvements
- **Mass Calculation**: More accurate diameter fallback logic
- **Spectral Classification**: Enhanced subtype handling  
- **Composition Mapping**: Updated based on recent meteorite studies
- **Economic Reality**: 2025 space delivery costs vs 2012 commodity prices
- **Risk Assessment**: Improved orbital mechanics evaluation

### Result Implications
- **Higher Values**: 2025 economics show 50-60x higher values than 2012
- **More Realistic**: Accounts for actual space mission costs
- **Better Accuracy**: Improved physical property calculations
- **Enhanced UX**: Comprehensive material breakdowns and risk assessment

---

## 10. Console Logging & Debugging

The system provides comprehensive console output for debugging:

```javascript
// Example console output for Ryugu asteroid:
🚀 STARTING ASTEROID CALCULATIONS for: 162173 Ryugu (1999 JU3)
📋 Asteroid data: {
  id: "2162173",
  absoluteMagnitude: 19.25,
  estimatedDiameter: { kilometers: { estimated_diameter_min: 0.87, estimated_diameter_max: 1.95 } },
  sbdbDiameter: null,
  spectralType: "C"
}

🔍 MASS CALCULATION START for: 162173 Ryugu (1999 JU3)
📏 Diameter calculation: 1.41 km
🏗️ Spectral type: C → Primary type: C → Density: 1200 kg/m³
📊 Volume calculation: (4/3)π × (1.41/2)³ = 1.47 km³
⚖️ Mass = volume × 1e9 × density = 1.47 × 1e9 × 1200 = 451.96B kg
📈 Final mass: 451.96 billion kg = 0.45 trillion kg

💰 PRICE CALCULATION:
  Spectral type: C
  Mass: 451.96 billion kg  
  Value per kg: $10.51
  Total value: $4.7T

📈 PROFIT CALCULATION: $311.5B

🧪 MATERIAL COMPOSITION ANALYSIS:
  iron: 10.000% = 45.20B kg
  nickel: 4.000% = 18.08B kg
  cobalt: 2.000% = 9.04B kg
  water: 20.000% = 90.39B kg
  carbon: 35.000% = 158.19B kg
  silicates: 25.000% = 112.99B kg
  other: 4.000% = 18.08B kg
```

This documentation provides a complete overview of our asteroid valuation pipeline, from NASA data ingestion through final economic assessment using the enhanced Asterank methodology with 2025 pricing.