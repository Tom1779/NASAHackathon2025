import { computed } from 'vue'
import type { Asteroid } from '../types/asteroid'

// Spectral type to composition mapping based on scientific literature
// Sources: 
// - Bus & Binzel (2002) - SMASSII Taxonomy
// - Tholen (1984) - Original taxonomy
// - DeMeo et al. (2009) - Bus-DeMeo taxonomy
// - Asteroid composition estimates from meteorite samples and spectroscopy
export const ASTEROID_COMPOSITIONS = {
  // C-type (Carbonaceous) asteroids - ~70% of all asteroids
  'C': {
    iron: 10,           // Low metal content
    nickel: 4,          // Associated with iron
    cobalt: 2,          // Industrial metal
    water: 20,          // High water content (hydrated minerals)
    carbon: 35,         // High carbon content
    silicates: 25,      // Rocky material
    other: 4,           // Other trace materials (no precious metals)
    displayName: 'Carbonaceous'
  },
  
  // B-type (Low-albedo Carbonaceous) asteroids - ~5% of all asteroids
  'B': {
    iron: 8,            // Lower metal content than C-type
    nickel: 3,          // Associated with iron
    cobalt: 1.5,        // Lower industrial metal
    water: 25,          // Higher water content (more hydrated)
    carbon: 40,         // Higher carbon content
    silicates: 20,      // Lower silicate content
    other: 2.5,         // Lower trace materials
    displayName: 'Low-Albedo Carbonaceous'
  },
  
  // S-type (Silicaceous/Stony) asteroids - ~17% of all asteroids
  'S': {
    iron: 25,           // Moderate metal content
    nickel: 12,         // Associated with iron
    cobalt: 3,          // Industrial metal
    water: 5,           // Low water content
    carbon: 2,          // Low carbon content
    silicates: 50,      // High silicate content
    other: 3,           // Other materials
    displayName: 'Stony'
  },
  
  // M-type (Metallic) asteroids - ~8% of all asteroids
  'M': {
    iron: 45,           // High metal content
    nickel: 35,         // High nickel content
    platinum: 0.05,     // Higher PGE content (only in M-type)
    gold: 0.02,         // Higher precious metal (only in M-type)
    cobalt: 5,          // Higher industrial metals
    water: 0,           // No water
    carbon: 0,          // No carbon
    silicates: 10,      // Low silicate content
    other: 4.88,        // Other trace metals and materials
    displayName: 'Metallic'
  },
  
  // V-type (Vesta-like) asteroids - Basaltic composition
  'V': {
    iron: 15,           // Moderate iron
    nickel: 6,          // Associated with iron
    cobalt: 2,          // Moderate cobalt
    water: 1,           // Very low water
    carbon: 0.5,        // Very low carbon
    silicates: 70,      // Very high silicate (basalt)
    other: 5.5,         // Other materials
    displayName: 'Basaltic'
  },

  // Additional Asterank spectral types
  
  // A-type asteroids - Olivine-rich
  'A': {
    iron: 5,            // Low metal content
    nickel: 2,          // Low nickel
    cobalt: 1,          // Low cobalt
    water: 0.1,         // Very low water
    carbon: 0.5,        // Very low carbon
    silicates: 85,      // Very high olivine silicates
    other: 6.4,         // Other materials
    displayName: 'Olivine-Rich'
  },

  // Ch-type (C-subtype with hydration) - Similar to C but more hydrated
  'Ch': {
    iron: 16.6,         // From Asterank data
    nickel: 1.4,        // From Asterank data  
    cobalt: 0.2,        // From Asterank data
    water: 20,          // High water content
    hydrogen: 23.5,     // Volatile hydrogen
    nitrogen: 0.1,      // Volatile nitrogen
    ammonia: 0.1,       // Volatile ammonia
    carbon: 30,         // High carbon content
    silicates: 8,       // Lower silicate content
    displayName: 'Hydrated Carbonaceous'
  },

  // Cg-type (C-subtype) - Carbonaceous variant
  'Cg': {
    iron: 16.6,         // From Asterank data
    nickel: 1.4,        // From Asterank data
    cobalt: 0.2,        // From Asterank data
    water: 20,          // High water content
    hydrogen: 23.5,     // Volatile hydrogen
    nitrogen: 0.1,      // Volatile nitrogen
    ammonia: 0.1,       // Volatile ammonia
    carbon: 30,         // High carbon content
    silicates: 8,       // Lower silicate content
    displayName: 'Carbonaceous Variant'
  },

  // Cgh-type (C-subtype with hydration and organics)
  'Cgh': {
    iron: 16.6,         // From Asterank data
    nickel: 1.4,        // From Asterank data
    cobalt: 0.2,        // From Asterank data
    water: 20,          // High water content
    hydrogen: 23.5,     // Volatile hydrogen
    nitrogen: 0.1,      // Volatile nitrogen
    ammonia: 0.1,       // Volatile ammonia
    carbon: 30,         // High carbon content
    silicates: 8,       // Lower silicate content
    displayName: 'Hydrated Organic Carbonaceous'
  },

  // Cb-type (Transition between C and B)
  'Cb': {
    iron: 8.3,          // From Asterank data
    nickel: 0.7,        // From Asterank data
    cobalt: 0.1,        // From Asterank data
    water: 10,          // Moderate water content
    hydrogen: 23.5,     // Volatile hydrogen
    nitrogen: 0.1,      // Volatile nitrogen
    ammonia: 0.1,       // Volatile ammonia
    carbon: 45,         // High carbon content
    silicates: 12,      // Moderate silicate content
    displayName: 'C-B Transition'
  },

  // D-type (Dark, outer belt objects)
  'D': {
    iron: 2,            // Very low metal
    nickel: 1,          // Very low nickel
    cobalt: 0.5,        // Very low cobalt
    water: 0.0023,      // Trace water (from Asterank)
    carbon: 80,         // Very high carbon/organics
    silicates: 15,      // Low silicate
    other: 1.4977,      // Other materials
    displayName: 'Dark Outer Belt'
  },

  // E-type (Enstatite, high-temperature formation)
  'E': {
    iron: 5,            // Low metal (reduced state)
    nickel: 3,          // Low nickel
    cobalt: 1,          // Low cobalt
    water: 0,           // No water (formed at high temp)
    carbon: 1,          // Very low carbon
    silicates: 85,      // Very high enstatite silicates
    other: 5,           // Other materials
    displayName: 'Enstatite'
  },

  // K-type (Intermediate between S and C)
  'K': {
    iron: 8.3,          // From Asterank data
    nickel: 0.7,        // From Asterank data
    cobalt: 0.1,        // From Asterank data
    water: 10,          // Moderate water content
    hydrogen: 23.5,     // Volatile hydrogen
    nitrogen: 0.1,      // Volatile nitrogen
    ammonia: 0.1,       // Volatile ammonia
    carbon: 20,         // Moderate carbon
    silicates: 37,      // Moderate silicate content
    displayName: 'S-C Intermediate'
  },

  // L-type (Low-albedo, similar to D-type)
  'L': {
    iron: 10,           // Low metal
    nickel: 5,          // Low nickel
    cobalt: 1,          // Low cobalt
    aluminum: 7,        // From Asterank data
    water: 2,           // Very low water
    carbon: 60,         // High carbon/organics
    silicates: 15,      // Magnesium silicate rich
    displayName: 'Low-Albedo'
  },

  // Ld-type (L-subtype)
  'Ld': {
    iron: 15,           // Moderate metal
    nickel: 8,          // Moderate nickel
    cobalt: 2,          // Moderate cobalt
    water: 3,           // Low water
    carbon: 5,          // Low carbon
    silicates: 65,      // Magnesium silicate rich
    other: 2,           // Other materials
    displayName: 'Low-Albedo Dense'
  },

  // O-type (Rare, igneous)
  'O': {
    iron: 25,           // Moderate metal
    nickel: 2.965,      // From Asterank nickel-iron
    platinum: 1.25,     // High platinum (from Asterank)
    cobalt: 3,          // Moderate cobalt
    water: 1,           // Very low water
    carbon: 2,          // Low carbon
    silicates: 60,      // High silicate
    other: 5.785,       // Other materials
    displayName: 'Igneous Olivine'
  },

  // P-type (Primitive, CI/CM chondrite-like)
  'P': {
    iron: 8,            // Low metal
    nickel: 4,          // Low nickel
    cobalt: 1,          // Low cobalt
    water: 12.5,        // From Asterank data
    carbon: 60,         // Very high organic content
    silicates: 12,      // Low silicate
    other: 2.5,         // Other materials
    displayName: 'Primitive Chondritic'
  },

  // Q-type (Ordinary chondrite-like)
  'Q': {
    iron: 20,           // Moderate metal
    nickel: 13.315,     // From Asterank nickel-iron
    cobalt: 3,          // Moderate cobalt
    water: 2,           // Low water
    carbon: 3,          // Low carbon
    silicates: 55,      // High silicate
    other: 3.685,       // Other materials
    displayName: 'Ordinary Chondritic'
  },

  // R-type (Igneous, olivine-pyroxene)
  'R': {
    iron: 12,           // Moderate metal
    nickel: 6,          // Moderate nickel
    cobalt: 2,          // Moderate cobalt
    water: 0.5,         // Very low water
    carbon: 1,          // Very low carbon
    silicates: 75,      // Very high silicate
    other: 3.5,         // Other materials
    displayName: 'Igneous Olivine-Pyroxene'
  },

  // T-type (Trojan-like)
  'T': {
    iron: 6,            // From Asterank data
    nickel: 3,          // Low nickel
    cobalt: 1,          // Low cobalt
    water: 5,           // Low water
    carbon: 70,         // Very high carbon/organics
    silicates: 13,      // Low silicate
    other: 2,           // Other materials
    displayName: 'Trojan-Like'
  },

  // U-type (Unclassified)
  'U': {
    iron: 15,           // Average metal
    nickel: 8,          // Average nickel
    cobalt: 2,          // Average cobalt
    water: 5,           // Low water
    carbon: 10,         // Moderate carbon
    silicates: 55,      // Moderate silicate
    other: 5,           // Other materials
    displayName: 'Unclassified'
  },

  // X-type (Metallic or enstatite-like, ambiguous)
  'X': {
    iron: 88,           // High metal (M-type assumption)
    nickel: 10,         // High nickel
    cobalt: 0.5,        // Moderate cobalt
    water: 0,           // No water
    carbon: 0,          // No carbon
    silicates: 1,       // Very low silicate
    other: 0.5,         // Other materials
    displayName: 'Ambiguous Metallic'
  },

  // Xe-type (X-subtype)
  'Xe': {
    iron: 88,           // High metal
    nickel: 10,         // High nickel
    cobalt: 0.5,        // Moderate cobalt
    water: 0,           // No water
    carbon: 0,          // No carbon
    silicates: 1,       // Very low silicate
    other: 0.5,         // Other materials
    displayName: 'Metallic X-subtype'
  },

  // Xc-type (X-subtype with precious metals)
  'Xc': {
    iron: 88,           // High metal
    nickel: 10,         // High nickel
    platinum: 0.005,    // From Asterank data
    cobalt: 0.5,        // Moderate cobalt
    water: 0,           // No water
    carbon: 0,          // No carbon
    silicates: 1,       // Very low silicate
    other: 0.495,       // Other materials
    displayName: 'Platinum-Rich Metallic'
  },

  // Xk-type (X-subtype)
  'Xk': {
    iron: 88,           // High metal
    nickel: 10,         // High nickel
    cobalt: 0.5,        // Moderate cobalt
    water: 0,           // No water
    carbon: 0,          // No carbon
    silicates: 1,       // Very low silicate
    other: 0.5,         // Other materials
    displayName: 'K-band Metallic'
  },

  // S-subtypes (transition objects)
  'Sa': {
    iron: 22,           // Moderate metal
    nickel: 10,         // Moderate nickel
    cobalt: 2.5,        // Moderate cobalt
    water: 4,           // Low water
    carbon: 1.5,        // Low carbon
    silicates: 57,      // High silicate
    other: 3,           // Other materials
    displayName: 'S-subtype A'
  },

  'Sq': {
    iron: 24,           // Moderate metal
    nickel: 11,         // Moderate nickel
    cobalt: 3,          // Moderate cobalt
    water: 4.5,         // Low water
    carbon: 2,          // Low carbon
    silicates: 52,      // High silicate
    other: 3.5,         // Other materials
    displayName: 'S-subtype Q'
  },

  'Sr': {
    iron: 23,           // Moderate metal
    nickel: 10.5,       // Moderate nickel
    cobalt: 2.5,        // Moderate cobalt
    water: 4,           // Low water
    carbon: 1.5,        // Low carbon
    silicates: 55,      // High silicate
    other: 3.5,         // Other materials
    displayName: 'S-subtype R'
  },

  'Sk': {
    iron: 21,           // Moderate metal
    nickel: 9.5,        // Moderate nickel
    cobalt: 2,          // Moderate cobalt
    water: 5,           // Low water
    carbon: 2,          // Low carbon
    silicates: 57,      // High silicate
    other: 3.5,         // Other materials
    displayName: 'S-subtype K'
  },

  'Sl': {
    iron: 22,           // Moderate metal
    nickel: 10,         // Moderate nickel
    cobalt: 2.5,        // Moderate cobalt
    water: 4.5,         // Low water
    carbon: 1.5,        // Low carbon
    silicates: 56,      // High silicate
    other: 3.5,         // Other materials
    displayName: 'S-subtype L'
  },

  // Default/Unknown composition (average of all types)
  'Unknown': {
    iron: 20,           // Average metal content
    nickel: 10,         // Average nickel
    cobalt: 3,          // Average industrial metal
    water: 8,           // Average water content
    carbon: 12,         // Average carbon
    silicates: 42,      // Average silicate
    other: 5,           // Other materials
    displayName: 'Unknown Type'
  }
}

// Material names and descriptions
export const MATERIAL_INFO = {
  iron: { name: 'Iron (Fe)', description: 'Primary structural metal for construction' },
  nickel: { name: 'Nickel (Ni)', description: 'Alloying metal for steel production' },
  platinum: { name: 'Platinum (Pt)', description: 'Precious metal for catalysis and electronics' },
  gold: { name: 'Gold (Au)', description: 'Precious metal for electronics and currency' },
  cobalt: { name: 'Cobalt (Co)', description: 'Strategic metal for batteries and alloys' },
  water: { name: 'Water (H₂O)', description: 'Essential for life support and fuel production' },
  carbon: { name: 'Carbon (C)', description: 'Organic compounds and structural materials' },
  silicates: { name: 'Silicate Rock', description: 'Construction materials and ceramics' },
  hydrogen: { name: 'Hydrogen (H)', description: 'Lightest element, fuel for fusion reactors' },
  nitrogen: { name: 'Nitrogen (N)', description: 'Essential for life support atmospheres' },
  ammonia: { name: 'Ammonia (NH₃)', description: 'Propellant and industrial chemical feedstock' },
  aluminum: { name: 'Aluminum (Al)', description: 'Lightweight structural metal for spacecraft' },
  other: { name: 'Other Materials', description: 'Rare earth elements and trace minerals' }
}

/**
 * Get asteroid composition based on spectral type
 */
export function getAsteroidComposition(asteroid: Asteroid) {
  // Try Tholen spectral type first (more common)
  let spectralType = asteroid.tholen_spectral_type
  
  // Fallback to SMASSII spectral type
  if (!spectralType) {
    spectralType = asteroid.smassii_spectral_type
  }
  
  // Extract the main spectral class (handle complex types like "Sq", "Ch", etc.)
  if (spectralType) {
    const mainType = spectralType.charAt(0).toUpperCase()
    if (ASTEROID_COMPOSITIONS[mainType as keyof typeof ASTEROID_COMPOSITIONS]) {
      return ASTEROID_COMPOSITIONS[mainType as keyof typeof ASTEROID_COMPOSITIONS]
    }
  }
  
  // Return null for unknown types - will be handled by getPossibleCompositions
  return null
}

/**
 * Get all possible compositions for unknown asteroids
 */
export function getPossibleCompositions() {
  // Return all known spectral type compositions (excluding Unknown)
  const compositions = Object.entries(ASTEROID_COMPOSITIONS)
    .filter(([key]) => key !== 'Unknown')
    .map(([key, composition]) => ({
      spectralType: key,
      composition,
      probability: getSpectralTypeProbability(key)
    }))
    .sort((a, b) => b.probability - a.probability) // Sort by probability
  
  return compositions
}

/**
 * Get statistical probability of spectral types (based on asteroid belt distribution)
 */
function getSpectralTypeProbability(type: string): number {
  const probabilities: Record<string, number> = {
    'C': 65,  // ~65% of asteroids are C-type
    'S': 15,  // ~15% are S-type  
    'M': 6,   // ~6% are M-type
    'B': 4,   // ~4% are B-type
    'D': 3,   // ~3% are D-type (outer belt)
    'P': 2,   // ~2% are P-type (primitive)
    'Ch': 1.5, // ~1.5% are Ch-type (hydrated C)
    'X': 1,   // ~1% are X-type (ambiguous)
    'V': 0.8, // ~0.8% are V-type (basaltic)
    'A': 0.5, // ~0.5% are A-type (olivine-rich)
    'E': 0.3, // ~0.3% are E-type (enstatite)
    'K': 0.3, // ~0.3% are K-type (S-C intermediate)
    'L': 0.3, // ~0.3% are L-type (low albedo)
    'Q': 0.2, // ~0.2% are Q-type (ordinary chondrite-like)
    'R': 0.1, // ~0.1% are R-type (olivine-pyroxene)
    'T': 0.1  // ~0.1% are T-type (Trojan-like)
    // Subtypes and rare types get 0 probability for unknown estimates
  }
  return probabilities[type] || 0
}

/**
 * Get display name for asteroid composition
 */
export function getCompositionDisplayName(asteroid: Asteroid): string {
  const composition = getAsteroidComposition(asteroid)
  return composition ? composition.displayName : 'Composition Unknown'
}

/**
 * Get the primary spectral type for display
 */
export function getSpectralType(asteroid: Asteroid): string {
  return asteroid.tholen_spectral_type || 
         asteroid.smassii_spectral_type || 
         'Unknown'
}

/**
 * Composable for asteroid composition analysis
 */
export function useComposition(asteroid: Asteroid) {
  const composition = computed(() => getAsteroidComposition(asteroid))
  
  const displayName = computed(() => getCompositionDisplayName(asteroid))
  
  const spectralType = computed(() => getSpectralType(asteroid))
  
  const isUnknown = computed(() => composition.value === null)
  
  const possibleCompositions = computed(() => {
    if (isUnknown.value) {
      return getPossibleCompositions()
    }
    return []
  })
  
  const materials = computed(() => {
    const comp = composition.value
    if (!comp) return []
    
    return Object.entries(comp)
      .filter(([key]) => key !== 'displayName')
      .map(([material, percentage]) => ({
        material,
        percentage,
        info: MATERIAL_INFO[material as keyof typeof MATERIAL_INFO] || { name: material, description: '' }
      }))
      .sort((a, b) => (b.percentage as number) - (a.percentage as number)) // Sort by percentage descending
  })
  
  return {
    composition,
    displayName,
    spectralType,
    isUnknown,
    possibleCompositions,
    materials
  }
}