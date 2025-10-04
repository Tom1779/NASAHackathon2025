<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Header Component -->
    <AppHeader />

    <!-- Main Content -->
    <main class="container mx-auto p-6">
      <!-- Top Section: Asteroid Selection & 3D Simulation -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Asteroid Selector -->
        <div class="lg:col-span-1">
          <AsteroidSelector
            :selected-asteroid="selectedAsteroid"
            :asteroids="asteroids"
            :loading-asteroids="loadingAsteroids"
            @update:selected-asteroid="selectedAsteroid = $event"
            @analyze="onAnalyzeAsteroid"
            @search="onSearchAsteroids"
          />
        </div>

        <!-- 3D Simulation Area -->
        <div class="lg:col-span-2">
          <AsteroidSimulation :selected-asteroid="selectedAsteroid" />
        </div>
      </div>

      <!-- Asteroid Details Section -->
      <AsteroidDetails :selected-asteroid="selectedAsteroid" />

      <!-- Close Approach Data -->
      <CloseApproachData :selected-asteroid="selectedAsteroid" />

      <!-- Worth Estimation -->
      <WorthEstimation :selected-asteroid="selectedAsteroid" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Import components
import AppHeader from './components/AppHeader.vue'
import AsteroidSelector from './components/AsteroidSelector.vue'
import AsteroidSimulation from './components/AsteroidSimulation.vue'
import AsteroidDetails from './components/AsteroidDetails.vue'
import CloseApproachData from './components/CloseApproachData.vue'
import WorthEstimation from './components/WorthEstimation.vue'

// Import composables and types
import { useAsteroids } from './composables/useAsteroids'
import type { Asteroid } from './types/asteroid'

// Composables
const { asteroids, loading: loadingAsteroids, fetchAsteroids, searchAsteroids, fetchDetailsForId } = useAsteroids()

// Reactive data
const selectedAsteroid = ref<Asteroid | null>(null)

// Event handlers
const onAnalyzeAsteroid = (asteroid: Asteroid) => {
  console.log('Analyzing asteroid:', asteroid.name)
  // This is where you would trigger detailed analysis
  // You can emit events or call methods for chemical composition analysis
}

const onSearchAsteroids = (query: string) => {
  // Route the selector's search into our composable catalog search so results
  // come from the CSV (no NEO queries until selection).
  console.log('Searching asteroids (catalog):', query)
  try {
    const results = searchAsteroids(query)
    asteroids.value = results
  } catch (e) {
    console.warn('Catalog search failed, leaving asteroids list unchanged', e)
  }
}

// Lifecycle
// When the app mounts, load the lightweight catalog + initial data placeholder
// Do NOT fetch the full NEO feed on mount. We'll show the CSV catalog and
// only query SBDB/NEO when the user selects an entry.
onMounted(() => {
  // Populate the selector with the full CSV catalog initially
  // by performing an empty search which returns the catalog mapping.
  try { asteroids.value = searchAsteroids('') } catch (e) { /* ignore */ }
})

// Watch selectedAsteroid for lightweight picks and fetch full details when needed
import { watch } from 'vue'

// When the user selects a catalog entry (which is lightweight), fetch fuller
// details from SBDB using the spkid (id) and then call the NEO details API
// using the same identifier to get any additional NEO-specific data. We log
// the NEO response to the Chrome console as requested.
watch(selectedAsteroid, async (val) => {
  if (!val) return

  // If the selected item looks like a lightweight catalog entry (no JPL url
  // or zero magnitude), look up SBDB first to populate details.
  if (!val.nasa_jpl_url || val.absolute_magnitude_h === 0) {
    const full = await fetchDetailsForId(val.id)
    if (full) {
      selectedAsteroid.value = full
    }
  }

  // NEO enrichment and caching are handled inside the composable's
  // `fetchDetailsForId`, which we already call above. No further action here.
})
</script>

<style scoped>
/* App-specific styles */
.container {
  max-width: 1400px;
}
</style>
