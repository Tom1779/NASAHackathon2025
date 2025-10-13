<template>
  <div class="asteroid-selector-wrapper">
    <Card class="bg-black/40 border border-purple-500/30">
      <template #title>
        <div class="flex items-center gap-2 text-white">
          <i class="pi pi-search text-purple-400"></i>
          Find Asteroid
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
        <!-- Search Input -->
        <div>
          <label class="block text-purple-300 mb-2 text-sm font-medium">
            Search by Name or ID:
          </label>
          <InputText
            v-model="searchQuery"
            :placeholder="selectedAsteroid ? `Selected: ${selectedAsteroid.name}` : 'Type asteroid name or ID...'"
            class="w-full"
            @input="onSearchInput"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          />
        </div>

        <!-- Advanced Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-purple-300 mb-1 text-xs font-medium">Hazardous Status:</label>
            <Select
              v-model="filters.hazardous"
              :options="hazardousOptions"
              placeholder="Any"
              class="w-full"
              @change="applyFilters"
            />
          </div>
          <div>
            <label class="block text-purple-300 mb-1 text-xs font-medium">Size Range:</label>
            <Select
              v-model="filters.sizeRange"
              :options="sizeRangeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Any size"
              class="w-full"
              @change="applyFilters"
            />
          </div>
          <div>
            <label class="block text-purple-300 mb-1 text-xs font-medium">Sort by:</label>
            <Select
              v-model="filters.sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Name"
              class="w-full"
              @change="applyFilters"
            />
          </div>
        </div>

        <!-- Search Results -->
        <div
          v-if="shouldShowDropdown"
          class="search-results-dropdown max-h-64 overflow-y-auto border border-purple-500/30 rounded-lg relative z-10"
          @click.stop
          @mousedown="keepDropdownOpen"
        >
          <div v-if="loadingSearch && stablePaginatedResults.length === 0" class="p-4 text-center text-purple-300">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Searching...
          </div>
          <div v-else-if="stablePaginatedResults.length === 0" class="p-4 text-center text-gray-400">
            No asteroids found matching your criteria
          </div>
          <div v-else>
            <div
              v-for="asteroid in stablePaginatedResults"
              :key="asteroid.id"
              class="p-3 hover:bg-purple-900/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer border-b border-purple-500/10 last:border-b-0"
              @click="selectAsteroid(asteroid)"
              :class="{ 'bg-purple-900/50': selectedAsteroid?.id === asteroid.id }"
              style="cursor: pointer;"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-circle text-yellow-400 text-xs"></i>
                  <span class="text-white font-medium">{{ asteroid.name }}</span>
                  <Badge
                    v-if="asteroid.is_potentially_hazardous_asteroid"
                    value="Hazardous"
                    severity="danger"
                    class="text-xs"
                  />
                </div>
                <span class="text-xs text-gray-400">{{ asteroid.id }}</span>
              </div>
              <div class="text-xs text-purple-300 mt-1">
                Magnitude: {{ asteroid.absolute_magnitude_h }}
              </div>
            </div>
            <!-- Pagination and Load More -->
            <div class="p-3 border-t border-purple-500/30">
              <!-- Local pagination for current results -->
              <div v-if="totalPages > 1" class="pagination-controls flex justify-between items-center mb-3">
                <Button
                  :disabled="currentPage === 1"
                  @click="goToPage(currentPage - 1); keepDropdownOpen()"
                  @mousedown="keepDropdownOpen"
                  size="small"
                  severity="secondary"
                  outlined
                  class="pagination-btn"
                >
                  <i class="pi pi-chevron-left"></i>
                </Button>
                <span class="text-xs text-purple-300">
                  Page {{ currentPage }} of {{ totalPages }}
                  <br class="block sm:hidden">
                  <span class="text-purple-400">
                    ({{ filteredAsteroids.length }} loaded{{ props.hasMoreNeoResults ? ', more available' : '' }})
                  </span>
                </span>
                <Button
                  :disabled="currentPage === totalPages && !props.hasMoreNeoResults"
                  @click="goToPage(currentPage + 1); keepDropdownOpen()"
                  @mousedown="keepDropdownOpen"
                  :loading="loadingMore && currentPage === totalPages"
                  size="small"
                  severity="secondary"
                  outlined
                  class="pagination-btn"
                >
                  <i class="pi pi-chevron-right" v-if="!loadingMore || currentPage !== totalPages"></i>
                  <i class="pi pi-spin pi-spinner" v-if="loadingMore && currentPage === totalPages"></i>
                </Button>
              </div>

              <!-- API Results summary -->
              <div v-if="filteredAsteroids.length > 0" class="text-xs text-purple-400 mb-2 text-center">
                {{ filteredAsteroids.length }} asteroids loaded
                <span v-if="hasMoreNeoResults"> • More available from NASA</span>
              </div>

              <!-- Background Loading Indicator -->
              <div class="text-xs text-center py-2">
                <div v-if="props.isLoadingAll" class="text-purple-300">
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Loading all asteroids in background... ({{ filteredAsteroids.length }} loaded)
                </div>
                <div v-else-if="props.allDataLoaded" class="text-green-400">
                  <i class="pi pi-check-circle mr-1"></i>
                  All {{ filteredAsteroids.length }} asteroids loaded
                </div>
                <div v-else-if="filteredAsteroids.length > 0" class="text-purple-400">
                  {{ filteredAsteroids.length }} asteroids available
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Access / Recent Selections -->
        <div v-if="!isSearchFocused && !searchQuery && !hasFilters">
          <div class="text-sm text-purple-300 mb-2">Quick Access:</div>
          <div class="grid grid-cols-2 gap-2">
            <Button
              @click="showRandomAsteroid"
              size="small"
              severity="secondary"
              outlined
              class="text-xs"
            >
              <i class="pi pi-refresh mr-1"></i>
              Random Asteroid
            </Button>
            <Button
              @click="showHazardousOnly"
              size="small"
              severity="danger"
              outlined
              class="text-xs"
            >
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Hazardous Only
            </Button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div
          v-if="selectedAsteroid"
          class="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/20"
        >
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-purple-300">Hazardous:</div>
            <div class="text-white">
              <Badge
                :value="selectedAsteroid.is_potentially_hazardous_asteroid ? 'Yes' : 'No'"
                :severity="
                  selectedAsteroid.is_potentially_hazardous_asteroid ? 'danger' : 'success'
                "
              />
            </div>
            <div class="text-purple-300">Magnitude:</div>
            <div class="text-white">{{ selectedAsteroid.absolute_magnitude_h }}</div>
          </div>
        </div>

        <!-- Action Button -->
        <Button
          :disabled="!selectedAsteroid"
          @click="handleAnalyze"
          class="w-full"
          severity="secondary"
        >
          <i class="pi pi-chart-bar mr-2"></i>
          Analyze Asteroid
        </Button>
      </div>
    </template>
  </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import InputText from 'primevue/inputtext'

import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
  asteroids: Asteroid[]
  loadingAsteroids: boolean
  hasMoreNeoResults?: boolean
  isLoadingAll?: boolean
  allDataLoaded?: boolean
}

interface Emits {
  (e: 'update:selectedAsteroid', asteroid: Asteroid | null): void
  (e: 'analyze', asteroid: Asteroid): void
  (e: 'search', query: string): void
  (e: 'loadMore'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Search and filter state
const searchQuery = ref('')
const isSearchFocused = ref(false)
const loadingSearch = ref(false)
const loadingMore = ref(false)
const showDropdown = ref(false)
let searchDebounceHandle: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const itemsPerPage = 100
const stablePaginatedResults = ref<Asteroid[]>([])

// Filter options
const filters = ref({
  hazardous: null as string | null,
  sizeRange: null as string | null,
  sortBy: 'name' as string
})

// Filter option arrays
const hazardousOptions = [
  'Hazardous Only',
  'Non-Hazardous',
  'All'
]

const sizeRangeOptions = [
  { label: 'Small (< 1km)', value: 'small' },
  { label: 'Medium (1-10km)', value: 'medium' },
  { label: 'Large (> 10km)', value: 'large' }
]

const sortOptions = [
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Size (Largest)', value: 'size-desc' },
  { label: 'Size (Smallest)', value: 'size-asc' },
  { label: 'Magnitude', value: 'magnitude' },
  { label: 'Hazardous First', value: 'hazardous' }
]

// Computed properties
const hasFilters = computed(() => {
  return (filters.value.hazardous && filters.value.hazardous !== 'All') ||
         filters.value.sizeRange !== null ||
         filters.value.sortBy !== 'name'
})

const shouldShowDropdown = computed(() => {
  return showDropdown.value || isSearchFocused.value || searchQuery.value || hasFilters.value
})

const filteredAsteroids = computed(() => {
  let filtered = [...props.asteroids]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(asteroid =>
      asteroid.name.toLowerCase().includes(query) ||
      asteroid.id.includes(query) ||
      asteroid.neo_reference_id.includes(query)
    )
  }

  // Apply hazardous filter
  if (filters.value.hazardous && filters.value.hazardous !== 'All') {
    if (filters.value.hazardous === 'Hazardous Only') {
      filtered = filtered.filter(asteroid => asteroid.is_potentially_hazardous_asteroid)
    } else if (filters.value.hazardous === 'Non-Hazardous') {
      filtered = filtered.filter(asteroid => !asteroid.is_potentially_hazardous_asteroid)
    }
  }

  // Apply size filter (based on magnitude - lower magnitude = larger)
  if (filters.value.sizeRange) {
    filtered = filtered.filter(asteroid => {
      const magnitude = asteroid.absolute_magnitude_h
      switch (filters.value.sizeRange) {
        case 'small': return magnitude > 22
        case 'medium': return magnitude >= 18 && magnitude <= 22
        case 'large': return magnitude < 18
        default: return true
      }
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size-desc':
        return a.absolute_magnitude_h - b.absolute_magnitude_h // Lower magnitude = larger
      case 'size-asc':
        return b.absolute_magnitude_h - a.absolute_magnitude_h
      case 'magnitude':
        return a.absolute_magnitude_h - b.absolute_magnitude_h
      case 'hazardous':
        if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1
        if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return filtered
})

const totalPages = computed(() => {
  const totalItems = filteredAsteroids.value.length
  const localPages = Math.ceil(totalItems / itemsPerPage)

  // If we have more data available from NASA API, add extra pages
  if (props.hasMoreNeoResults) {
    return localPages + 3 // Show 3 additional pages that will trigger API loads
  }

  return Math.max(localPages, 1)
})

const paginatedResults = computed(() => {
  const totalItems = filteredAsteroids.value.length
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage

  // Check if we need more data from API
  const needsMoreData = end > totalItems && props.hasMoreNeoResults

  if (needsMoreData) {
    // Trigger load more in next tick to avoid computed side effects
    nextTick(() => {
      if (!loadingMore.value && props.hasMoreNeoResults) {
        loadMoreFromNeo()
      }
    })

    // Return what we have for now
    return filteredAsteroids.value.slice(start, totalItems)
  }

  return filteredAsteroids.value.slice(start, end)
})

// Methods
const onSearchInput = () => {
  if (searchDebounceHandle !== null) {
    clearTimeout(searchDebounceHandle)
  }

  loadingSearch.value = true
  currentPage.value = 1

  searchDebounceHandle = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300)
}

const onSearchFocus = () => {
  isSearchFocused.value = true
  showDropdown.value = true
}

const onSearchBlur = () => {
  // Don't close on blur at all - we handle closing via click-outside detection
  // This completely prevents flickering from blur events
  return
}

const keepDropdownOpen = () => {
  showDropdown.value = true
  isSearchFocused.value = true
}

const applyFilters = () => {
  currentPage.value = 1
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  // Check if click is inside the selector component wrapper
  const wrapper = document.querySelector('.asteroid-selector-wrapper')
  if (wrapper && wrapper.contains(target)) {
    // Click is inside, don't close
    return
  }

  // Click is outside, close the dropdown
  if (showDropdown.value) {
    showDropdown.value = false
    isSearchFocused.value = false
  }
}

// Setup click outside listener
onMounted(() => {
  // Use capture phase and add a small delay to ensure DOM is ready
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 100)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  if (searchDebounceHandle !== null) {
    clearTimeout(searchDebounceHandle)
    searchDebounceHandle = null
  }
})

const selectAsteroid = (asteroid: Asteroid) => {
  emit('update:selectedAsteroid', asteroid)
  // Reset search and filters after selection
  searchQuery.value = ''
  filters.value.hazardous = null
  filters.value.sizeRange = null
  filters.value.sortBy = 'name'
  currentPage.value = 1
  isSearchFocused.value = false
  showDropdown.value = false

  // Scroll to top of page
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleAnalyze = () => {
  if (props.selectedAsteroid) {
    emit('analyze', props.selectedAsteroid)
  }
}

const showRandomAsteroid = () => {
  if (props.asteroids.length > 0) {
    const randomIndex = Math.floor(Math.random() * props.asteroids.length)
    const randomAsteroid = props.asteroids[randomIndex]
    if (randomAsteroid) {
      selectAsteroid(randomAsteroid)
    }
  }
}

const showHazardousOnly = () => {
  filters.value.hazardous = 'Hazardous Only'
  applyFilters()
}

const loadMoreFromNeo = async () => {
  if (loadingMore.value) return

  loadingMore.value = true
  try {
    emit('loadMore')
  } catch (error) {
    console.error('Failed to load more asteroids:', error)
  } finally {
    loadingMore.value = false
  }
}

// Auto-load more data when user navigates to a page that needs more data
const goToPage = async (page: number) => {
  const requiredItems = page * itemsPerPage
  const currentItems = filteredAsteroids.value.length

  // If we need more items and API has more data, load it first
  if (requiredItems > currentItems && props.hasMoreNeoResults && !loadingMore.value) {
    await loadMoreFromNeo()
  }

  currentPage.value = page
}

// Watch for filter changes to reset pagination
watch([filters, searchQuery], () => {
  currentPage.value = 1
}, { deep: true })

watch(paginatedResults, (newResults) => {
  if (newResults.length > 0) {
    stablePaginatedResults.value = newResults
  }
}, { immediate: true })

watch(() => props.loadingAsteroids, (isLoading) => {
  loadingSearch.value = isLoading && (isSearchFocused.value || Boolean(searchQuery.value))
})
</script>
