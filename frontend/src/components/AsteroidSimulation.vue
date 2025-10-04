<template>
  <Card class="bg-black/40 border border-purple-500/30 h-96">
    <template #title>
      <div class="flex items-center gap-2 text-white">
        <i class="pi pi-globe text-blue-400"></i>
        3D Simulation
      </div>
    </template>
    <template #content>
      <div class="simulation-container">
        <div v-if="!selectedAsteroid" class="content-center text-purple-300">
          <i class="pi pi-eye text-4xl mb-4"></i>
          <p>Select an asteroid to view 3D simulation</p>
        </div>
        <div v-else class="content-center">
          <div class="animate-pulse">
            <i class="pi pi-spin pi-spinner text-4xl mb-4"></i>
            <p class="mb-2">Loading 3D simulation for {{ selectedAsteroid.name }}...</p>
            <p class="text-sm text-purple-300">3D visualization will be integrated here</p>
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

<style scoped>
.simulation-container {
  height: 320px;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(88, 28, 135, 0.2) 100%);
  border-radius: 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
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
