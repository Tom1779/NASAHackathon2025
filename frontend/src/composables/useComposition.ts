import { computed } from 'vue'
import type { Asteroid } from '../types/asteroid'

// Spectral type to composition mapping based on scientific literature
// Sources: 
// - Bus & Binzel (2002) - SMASSII Taxonomy
// - Tholen (1984) - Original taxonomy
// - DeMeo et al. (2009) - Bus-DeMeo taxonomy
// - Asteroid composition estimates from meteorite samples and spectroscopy
export const ASTEROID_COMPOSITIONS = {
  // C-type (Carbonaceous) asteroids - ~75% of all asteroids
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
  
  // Fallback to unknown composition
  return ASTEROID_COMPOSITIONS.Unknown
}

/**
 * Get display name for asteroid composition
 */
export function getCompositionDisplayName(asteroid: Asteroid): string {
  const composition = getAsteroidComposition(asteroid)
  return composition.displayName
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
  
  const materials = computed(() => {
    const comp = composition.value
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
    materials
  }
}