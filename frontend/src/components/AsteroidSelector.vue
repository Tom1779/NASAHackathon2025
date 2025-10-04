<template>
  <Card class="bg-black/40 border border-purple-500/30">
    <template #title>
      <div class="flex items-center gap-2 text-white">
        <i class="pi pi-search text-purple-400"></i>
        Select Asteroid
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Asteroid Dropdown -->
        <div>
          <label class="block text-purple-300 mb-2 text-sm font-medium">
            Choose an Asteroid:
          </label>
          <Select
            :model-value="selectedAsteroid"
            @update:model-value="handleAsteroidSelect"
            :options="asteroids"
            optionLabel="name"
            placeholder="Select an asteroid..."
            class="w-full"
            :loading="loadingAsteroids"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <i class="pi pi-circle text-yellow-400 text-xs"></i>
                <span>{{ option.name }}</span>
                <span class="text-xs text-gray-400 ml-auto"> ID: {{ option.id }} </span>
              </div>
            </template>
          </Select>
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
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Badge from 'primevue/badge'

import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
  asteroids: Asteroid[]
  loadingAsteroids: boolean
}

interface Emits {
  (e: 'update:selectedAsteroid', asteroid: Asteroid | null): void
  (e: 'analyze', asteroid: Asteroid): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleAsteroidSelect = (asteroid: Asteroid | null) => {
  emit('update:selectedAsteroid', asteroid)
}

const handleAnalyze = () => {
  if (props.selectedAsteroid) {
    emit('analyze', props.selectedAsteroid)
  }
}
</script>
