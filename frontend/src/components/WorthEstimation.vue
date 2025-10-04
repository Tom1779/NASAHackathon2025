<template>
  <div v-if="selectedAsteroid" class="mt-6">
    <Card class="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/30">
      <template #title>
        <div class="flex items-center gap-2 text-white">
          <i class="pi pi-dollar text-yellow-400"></i>
          Estimated Worth
        </div>
      </template>
      <template #content>
        <div class="text-center py-8">
          <div class="text-6xl text-yellow-400 mb-4">💎</div>
          <p class="text-2xl text-white font-bold mb-2">Coming Soon</p>
          <p class="text-purple-300">
            Chemical analysis and worth estimation will be calculated based on composition data
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
}

defineProps<Props>()
</script>
