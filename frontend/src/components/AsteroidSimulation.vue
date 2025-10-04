<template>
  <Card class="bg-black/40 border border-purple-500/30">
    <template #title>
      <div class="flex items-center justify-between text-white">
        <div class="flex items-center gap-2">
          <i class="pi pi-globe text-blue-400"></i>
          3D Simulation
        </div>
        <div v-if="!loading && !error && selectedAsteroid" class="controls-hint">
          <span class="text-xs text-purple-300">
            <i class="pi pi-mouse"></i> Rotate • Scroll to Zoom • Right-click to Pan
          </span>
        </div>
      </div>
    </template>
    <template #content>
      <div class="simulation-container">
        <div v-if="!selectedAsteroid" class="content-center text-purple-300">
          <i class="pi pi-eye text-4xl mb-4"></i>
          <p>Select an asteroid to view 3D simulation</p>
        </div>
        <div v-else-if="loading" class="content-center">
          <div class="animate-pulse">
            <i class="pi pi-spin pi-spinner text-4xl mb-4"></i>
            <p class="mb-2">Loading orbital data for {{ selectedAsteroid.name }}...</p>
          </div>
        </div>
        <div v-else-if="error" class="content-center text-red-400">
          <i class="pi pi-exclamation-triangle text-4xl mb-4"></i>
          <p class="mb-2">Error loading orbital data</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <div v-else ref="sceneContainer" class="scene-container"></div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import Card from 'primevue/card'
import type { Asteroid } from '../types/asteroid'
import { AsteroidScene } from '../utils/threeScene'
import { useOrbitalData } from '../composables/useOrbitalData'

interface Props {
  selectedAsteroid: Asteroid | null
}

const props = defineProps<Props>()

const sceneContainer = ref<HTMLElement | null>(null)
const { orbitalData, loading, error, fetchOrbitalData } = useOrbitalData()

let scene: AsteroidScene | null = null

// Watch for asteroid selection changes
watch(() => props.selectedAsteroid, async (newAsteroid) => {
  if (newAsteroid) {
    // Fetch orbital data
    await fetchOrbitalData(newAsteroid.id)

    // Initialize or update scene when orbital data is ready
    if (orbitalData.value && sceneContainer.value) {
      initScene()
    }
  } else {
    // Clean up scene if asteroid is deselected
    if (scene) {
      scene.dispose()
      scene = null
    }
  }
}, { immediate: true })

// Watch for orbital data changes
watch(orbitalData, (newData) => {
  if (newData && sceneContainer.value && props.selectedAsteroid) {
    initScene()
  }
})

const initScene = () => {
  if (!sceneContainer.value || !orbitalData.value || !props.selectedAsteroid) return

  // Clean up existing scene
  if (scene) {
    scene.dispose()
  }

  // Create new scene
  scene = new AsteroidScene({
    container: sceneContainer.value,
    showGrid: false,
    showAxes: false
  })

  // Get asteroid diameter in km
  const diameter = props.selectedAsteroid.estimated_diameter.kilometers
    ? (props.selectedAsteroid.estimated_diameter.kilometers.estimated_diameter_min +
       props.selectedAsteroid.estimated_diameter.kilometers.estimated_diameter_max) / 2
    : 1.0

  // Add asteroid to scene with orbital elements
  scene.setAsteroid(
    orbitalData.value,
    props.selectedAsteroid.name,
    diameter
  )
}

// Clean up on component unmount
onBeforeUnmount(() => {
  if (scene) {
    scene.dispose()
    scene = null
  }
})

// Handle container mounting
onMounted(() => {
  if (props.selectedAsteroid && orbitalData.value && sceneContainer.value) {
    initScene()
  }
})
</script>

<style scoped>
.simulation-container {
  height: 600px;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(88, 28, 135, 0.2) 100%);
  border-radius: 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.scene-container:active {
  cursor: grabbing;
}

.controls-hint {
  font-size: 0.75rem;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.content-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.content-center.text-purple-300 {
  color: rgb(196 181 253);
}
</style>
