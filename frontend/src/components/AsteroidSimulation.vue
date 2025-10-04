<template>
  <Card class="bg-black/40 border border-purple-500/30 h-96">
    <template #title>
      <div class="flex items-center gap-2 text-white">
        <i class="pi pi-globe text-blue-400"></i>
        3D Simulation
      </div>
    </template>
    <template #content>
      <div
        class="h-80 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20 flex items-center justify-center"
      >
        <div v-if="!selectedAsteroid" class="text-center text-purple-300">
          <i class="pi pi-eye text-4xl mb-4 block"></i>
          <p>Select an asteroid to view 3D simulation</p>
        </div>
        <div v-else class="text-center text-white">
          <div class="animate-pulse">
            <i class="pi pi-spin pi-spinner text-4xl mb-4 block"></i>
            <p>Loading 3D simulation for {{ selectedAsteroid.name }}...</p>
            <p class="text-sm text-purple-300 mt-2">3D visualization will be integrated here</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
}

defineProps<Props>()
</script>
