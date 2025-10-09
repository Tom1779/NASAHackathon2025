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
          class="search-results-dropdown max-h-96 overflow-y-auto border border-purple-500/30 rounded-lg relative z-10"
          @click.stop
          @mousedown="keepDropdownOpen"
        >
          <div v-if="loadingSearch" class="p-4 text-center text-purple-300">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Loading asteroids...
          </div>
          <div v-else-if="nameMatches.length === 0 && idMatches.length === 0" class="p-4 text-center text-gray-400">
            No asteroids found matching your criteria
          </div>
          <div v-else>
            <!-- Default/Featured Header (shown when no search query) -->
            <div v-if="!searchQuery.trim() && paginatedNameMatches.length > 0">
              <div class="sticky top-0 bg-purple-900/90 px-3 py-2 border-b border-purple-500/30 z-10">
                <span class="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                  <i class="pi pi-star-fill text-yellow-400 mr-1"></i>
                  Featured & Hazardous Asteroids ({{ nameMatches.length }})
                </span>
              </div>
            </div>

            <!-- Name Matches Section -->
            <div v-if="paginatedNameMatches.length > 0 && searchQuery.trim()">
              <div class="sticky top-0 bg-purple-900/90 px-3 py-2 border-b border-purple-500/30 z-10">
                <span class="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                  Name Matches ({{ nameMatches.length }})
                </span>
              </div>
            </div>
            
            <div
              v-for="asteroid in paginatedNameMatches"
              :key="`name-${asteroid.id}`"
              class="asteroid-result-item p-3 hover:bg-purple-900/30 transition-all duration-200 cursor-pointer border-b border-purple-500/10 group select-none"
              @click="selectAsteroid(asteroid)"
              :class="{ 'bg-purple-900/50': selectedAsteroid?.id === asteroid.id }"
            >
              <div class="flex items-center justify-between pointer-events-none">
                <div class="flex items-center gap-2">
                  <i class="pi pi-circle text-yellow-400 text-xs"></i>
                  <span class="asteroid-name text-white font-medium group-hover:text-purple-300 transition-colors">{{ asteroid.name }}</span>
                  <Badge
                    v-if="asteroid.is_potentially_hazardous_asteroid"
                    value="Hazardous"
                    severity="danger"
                    class="text-xs"
                  />
                </div>
                <span class="text-xs text-gray-400">{{ asteroid.id }}</span>
              </div>
              <div class="text-xs text-purple-300 mt-1 pointer-events-none">
                Magnitude: {{ asteroid.absolute_magnitude_h.toFixed(2) }}
                <span v-if="asteroid.estimated_diameter?.kilometers" class="ml-2">
                  • Size: ~{{ ((asteroid.estimated_diameter.kilometers.estimated_diameter_min + 
                    asteroid.estimated_diameter.kilometers.estimated_diameter_max) / 2).toFixed(2) }} km
                </span>
              </div>
            </div>

            <!-- ID Matches Section -->
            <div v-if="paginatedIdMatches.length > 0">
              <div class="sticky top-0 bg-purple-900/90 px-3 py-2 border-b border-purple-500/30 z-10">
                <span class="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                  ID Matches ({{ idMatches.length }})
                </span>
              </div>
              <div
                v-for="asteroid in paginatedIdMatches"
                :key="`id-${asteroid.id}`"
                class="asteroid-result-item p-3 hover:bg-purple-900/30 transition-all duration-200 cursor-pointer border-b border-purple-500/10 group select-none"
                @click="selectAsteroid(asteroid)"
                :class="{ 'bg-purple-900/50': selectedAsteroid?.id === asteroid.id }"
              >
                <div class="flex items-center justify-between pointer-events-none">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-circle text-yellow-400 text-xs"></i>
                    <span class="asteroid-name text-white font-medium group-hover:text-purple-300 transition-colors">{{ asteroid.name }}</span>
                    <Badge
                      v-if="asteroid.is_potentially_hazardous_asteroid"
                      value="Hazardous"
                      severity="danger"
                      class="text-xs"
                    />
                  </div>
                  <span class="text-xs text-gray-400">{{ asteroid.id }}</span>
                </div>
                <div class="text-xs text-purple-300 mt-1 pointer-events-none">
                  Magnitude: {{ asteroid.absolute_magnitude_h.toFixed(2) }}
                  <span v-if="asteroid.estimated_diameter?.kilometers" class="ml-2">
                    • Size: ~{{ ((asteroid.estimated_diameter.kilometers.estimated_diameter_min + 
                      asteroid.estimated_diameter.kilometers.estimated_diameter_max) / 2).toFixed(2) }} km
                  </span>
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div class="p-3 border-t border-purple-500/30 bg-black/40">
              <div v-if="totalPages > 1" class="pagination-controls flex justify-between items-center mb-2">
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
                    ({{ totalMatches }} total results)
                  </span>
                </span>
                <Button
                  :disabled="currentPage === totalPages"
                  @click="goToPage(currentPage + 1); keepDropdownOpen()"
                  @mousedown="keepDropdownOpen"
                  size="small"
                  severity="secondary"
                  outlined
                  class="pagination-btn"
                >
                  <i class="pi pi-chevron-right"></i>
                </Button>
              </div>

              <!-- Results Summary -->
              <div class="text-xs text-center">
                <div v-if="props.allDataLoaded" class="text-green-400">
                  <i class="pi pi-check-circle mr-1"></i>
                  Searching {{ props.asteroids.length }} asteroids
                </div>
                <div v-else-if="props.isLoadingAll" class="text-purple-300">
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Loading asteroid database...
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
            <div class="text-white">{{ selectedAsteroid.absolute_magnitude_h.toFixed(2) }}</div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
  isLoadingAll?: boolean
  allDataLoaded?: boolean
}

interface Emits {
  (e: 'update:selectedAsteroid', asteroid: Asteroid | null): void
  (e: 'analyze', asteroid: Asteroid): void
  (e: 'search', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Search and filter state
const searchQuery = ref('')
const isSearchFocused = ref(false)
const loadingSearch = ref(false)
const showDropdown = ref(false)
let searchDebounceHandle: ReturnType<typeof setTimeout> | null = null
const currentPage = ref(1)
const itemsPerPage = 20 // Changed from 100 to 20

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

  // Apply hazardous filter
  if (filters.value.hazardous && filters.value.hazardous !== 'All') {
    if (filters.value.hazardous === 'Hazardous Only') {
      filtered = filtered.filter(asteroid => asteroid.is_potentially_hazardous_asteroid)
    } else if (filters.value.hazardous === 'Non-Hazardous') {
      filtered = filtered.filter(asteroid => !asteroid.is_potentially_hazardous_asteroid)
    }
  }

  // Apply size filter (based on estimated diameter in kilometers)
  if (filters.value.sizeRange) {
    filtered = filtered.filter(asteroid => {
      // Get diameter from estimated_diameter (use average of min/max)
      const diameterKm = asteroid.estimated_diameter?.kilometers
      
      if (!diameterKm) {
        // Fallback to magnitude-based estimation if diameter not available
        const magnitude = asteroid.absolute_magnitude_h
        switch (filters.value.sizeRange) {
          case 'small': return magnitude > 22
          case 'medium': return magnitude >= 18 && magnitude <= 22
          case 'large': return magnitude < 18
          default: return true
        }
      }
      
      // Calculate average diameter
      const avgDiameter = (diameterKm.estimated_diameter_min + diameterKm.estimated_diameter_max) / 2
      
      // Size ranges based on actual diameter
      switch (filters.value.sizeRange) {
        case 'small': return avgDiameter < 1      // Less than 1 km
        case 'medium': return avgDiameter >= 1 && avgDiameter < 10  // 1-10 km
        case 'large': return avgDiameter >= 10    // 10+ km
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

// Get default/featured asteroids when no search query
const defaultResults = computed(() => {
  if (searchQuery.value.trim()) return []
  
  // Show interesting asteroids by default
  const featured = filteredAsteroids.value.filter(asteroid => {
    // Famous or interesting asteroids
    const name = asteroid.name.toLowerCase()
    return name.includes('apophis') ||
           name.includes('bennu') ||
           name.includes('eros') ||
           name.includes('geographos') ||
           name.includes('toutatis') ||
           name.includes('itokawa') ||
           name.includes('ryugu') ||
           asteroid.is_potentially_hazardous_asteroid
  })
  
  // If we have featured asteroids, return them
  if (featured.length > 0) {
    // Sort hazardous first, then by size (smaller magnitude = larger)
    return featured.sort((a, b) => {
      if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1
      if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1
      return a.absolute_magnitude_h - b.absolute_magnitude_h
    })
  }
  
  // Fallback: show first batch of filtered asteroids
  return filteredAsteroids.value.slice(0, 100)
})

// Separate name and ID matches
const nameMatches = computed(() => {
  if (!searchQuery.value.trim()) return defaultResults.value
  
  const query = searchQuery.value.toLowerCase()
  return filteredAsteroids.value.filter(asteroid =>
    asteroid.name.toLowerCase().includes(query)
  )
})

const idMatches = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  return filteredAsteroids.value.filter(asteroid =>
    !asteroid.name.toLowerCase().includes(query) && (
      asteroid.id.toLowerCase().includes(query) ||
      asteroid.neo_reference_id.toLowerCase().includes(query)
    )
  )
})

const totalMatches = computed(() => nameMatches.value.length + idMatches.value.length)

const totalPages = computed(() => {
  return Math.max(Math.ceil(totalMatches.value / itemsPerPage), 1)
})

// Paginate results - show name matches first, then ID matches
const paginatedNameMatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  if (start >= nameMatches.value.length) {
    return []
  }
  
  return nameMatches.value.slice(start, Math.min(end, nameMatches.value.length))
})

const paginatedIdMatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  // If we're still showing name matches, don't show ID matches yet
  if (start < nameMatches.value.length) {
    // Calculate remaining slots after name matches
    const remainingSlots = end - nameMatches.value.length
    if (remainingSlots <= 0) return []
    
    return idMatches.value.slice(0, remainingSlots)
  }
  
  // We've gone past all name matches, now show ID matches
  const idStart = start - nameMatches.value.length
  const idEnd = end - nameMatches.value.length
  
  return idMatches.value.slice(idStart, idEnd)
})

// Methods
const onSearchInput = () => {
  if (searchDebounceHandle !== null) {
    clearTimeout(searchDebounceHandle)
  }

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
  // Don't close on blur - handle via click-outside
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

  const wrapper = document.querySelector('.asteroid-selector-wrapper')
  if (wrapper && wrapper.contains(target)) {
    return
  }

  if (showDropdown.value) {
    showDropdown.value = false
    isSearchFocused.value = false
  }
}

// Setup click outside listener
onMounted(() => {
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
  searchQuery.value = ''
  filters.value.hazardous = null
  filters.value.sizeRange = null
  filters.value.sortBy = 'name'
  currentPage.value = 1
  isSearchFocused.value = false
  showDropdown.value = false

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
  if (filteredAsteroids.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredAsteroids.value.length)
    const randomAsteroid = filteredAsteroids.value[randomIndex]
    if (randomAsteroid) {
      selectAsteroid(randomAsteroid)
    }
  }
}

const showHazardousOnly = () => {
  filters.value.hazardous = 'Hazardous Only'
  applyFilters()
}

const goToPage = (page: number) => {
  currentPage.value = page
}

// Watch for filter changes to reset pagination
watch([filters, searchQuery], () => {
  currentPage.value = 1
}, { deep: true })

watch(() => props.loadingAsteroids, (isLoading) => {
  loadingSearch.value = isLoading && props.isLoadingAll === true
})
</script>

<style scoped>
/* Force cursor and selection behavior for result items */
.asteroid-result-item {
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.asteroid-result-item * {
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.asteroid-name {
  cursor: pointer !important;
}

/* Purple highlight on hover */
.asteroid-result-item:hover .asteroid-name {
  color: rgb(216, 180, 254) !important; /* purple-300 */
}
</style>