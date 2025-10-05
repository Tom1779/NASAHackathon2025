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
            :has-more-neo-results="neoHasMore"
            :is-loading-all="isLoadingAll"
            :all-data-loaded="allDataLoaded"
            @update:selected-asteroid="onSelectAsteroid"
            @analyze="onAnalyzeAsteroid"
            @search="onSearchAsteroids"
            @load-more="onLoadMoreAsteroids"
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
  neoHasMore,
  isLoadingAll,
  allDataLoaded,
  searchAsteroids,
  loadMoreAsteroids,
  loadAllDataInBackground,
  waitForAllData,
  fetchDetailsForId,
  ensureCatalogPrefetched,
} = useAsteroids()

// Reactive data
const currentPage = ref<'home' | 'about'>('home')
const selectedAsteroid = ref<Asteroid | null>(null)

// Event handlers
const onAnalyzeAsteroid = (asteroid: Asteroid) => {
  console.log('Analyzing asteroid:', asteroid.name)
  // This is where you would trigger detailed analysis
  // You can emit events or call methods for chemical composition analysis
}

const onSearchAsteroids = async (query: string) => {
  // Wait for all data to be loaded before searching
  console.log('Searching asteroids (NEO browse):', query)
  try {
    // If there's a query and data isn't fully loaded, wait for it
    if (query && query.trim() && !allDataLoaded.value) {
      console.log('Waiting for all data before searching...')
      await waitForAllData()
    }
    await searchAsteroids(query)
  } catch (e) {
    console.warn('NEO search failed, leaving asteroids list unchanged', e)
  }
}

const onLoadMoreAsteroids = async () => {
  console.log('Loading more asteroids from NEO browse API')
  try {
    await loadMoreAsteroids()
  } catch (e) {
    console.warn('Load more asteroids failed:', e)
  }
}

// Lifecycle
// When the app mounts, load the initial NEO data and start background loading
onMounted(async () => {
  // Populate the selector with NEO browse data initially
  try {
    await ensureCatalogPrefetched()
    await searchAsteroids('')

    // Start loading all data in the background
    console.log('Starting automatic background data load...')
    loadAllDataInBackground().then(() => {
      console.log('All NEO data loaded successfully!')
    }).catch(err => {
      console.error('Background loading encountered an error:', err)
    })
  } catch (e) {
    console.debug('Initial NEO load failed', e)
  }
})

// Watch selectedAsteroid for lightweight picks and fetch full details when needed
// Handle explicit selection from the selector. We fetch full details via the
// composable and only then update `selectedAsteroid`. This ensures SBDB and
// NEO are invoked exactly once per user selection (and uses the composable's
// cache to avoid repeats).
const onSelectAsteroid = async (astro: Asteroid | null) => {
  if (!astro) {
    selectedAsteroid.value = null
    return
  }

  // If this is a lightweight catalog entry (no JPL url or zero magnitude),
  // fetch full details first using the SPKID. Otherwise, use the provided
  // asteroid object as-is.
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
