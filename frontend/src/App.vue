<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Header Component -->
    <AppHeader @navigate="currentPage = $event" />

    <!-- About Page -->
    <AboutPage v-if="currentPage === 'about'" />

    <!-- Main Content -->
    <main v-else class="container mx-auto p-6">
      <!-- Top Section: Asteroid Selection & 3D Simulation -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Asteroid Selector -->
        <div class="lg:col-span-1">
          <AsteroidSelector
            :selected-asteroid="selectedAsteroid"
            :asteroids="asteroids"
            :loading-asteroids="loadingAsteroids"
            :is-loading-all="isLoadingAll"
            :all-data-loaded="allDataLoaded"
            @update:selected-asteroid="onSelectAsteroid"
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
import AboutPage from './components/AboutPage.vue'
import AsteroidSelector from './components/AsteroidSelector.vue'
import AsteroidSimulation from './components/AsteroidSimulation.vue'
import AsteroidDetails from './components/AsteroidDetails.vue'
import CloseApproachData from './components/CloseApproachData.vue'
import WorthEstimation from './components/WorthEstimation.vue'

// Import composables and types
import { useAsteroids } from './composables/useAsteroids'
import type { Asteroid } from './types/asteroid'

// Composables
const {
  asteroids,
  loading: loadingAsteroids,
  isLoadingAll,
  allDataLoaded,
  searchAsteroids,
  loadAllAsteroidsFromJson,
  fetchDetailsForId,
} = useAsteroids()

// Reactive data
const currentPage = ref<'home' | 'about'>('home')
const selectedAsteroid = ref<Asteroid | null>(null)

// Event handlers
const onAnalyzeAsteroid = (asteroid: Asteroid) => {
  console.log('Analyzing asteroid:', asteroid.name)
  // This is where you would trigger detailed analysis
}

const onSearchAsteroids = async (query: string) => {
  console.log('Searching asteroids:', query)
  try {
    await searchAsteroids(query)
  } catch (e) {
    console.warn('Search failed:', e)
  }
}

// Lifecycle
onMounted(async () => {
  // Load all asteroids from local JSON file
  try {
    console.log('Loading all asteroids from JSON...')
    await loadAllAsteroidsFromJson()
    console.log('All asteroids loaded successfully!')
  } catch (e) {
    console.error('Failed to load asteroids:', e)
  }
})

// Handle asteroid selection
const onSelectAsteroid = async (astro: Asteroid | null) => {
  if (!astro) {
    selectedAsteroid.value = null
    return
  }

  // If this is a lightweight entry (no JPL url or zero magnitude),
  // fetch full details first. Otherwise, use as-is.
  if (!astro.nasa_jpl_url || astro.absolute_magnitude_h === 0) {
    const full = await fetchDetailsForId(astro.id)
    if (full) {
      selectedAsteroid.value = full
      return
    }
  }

  selectedAsteroid.value = astro
}
</script>

<style scoped>
/* App-specific styles */
.container {
  max-width: 1400px;
}
</style>