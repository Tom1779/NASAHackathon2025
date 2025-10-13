<template>
  <div v-if="selectedAsteroid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Basic Information -->
    <Card class="bg-black/40 border border-purple-500/30">
      <template #title>
        <div class="flex items-center gap-2 text-white">
          <i class="pi pi-info-circle text-green-400"></i>
          Basic Information
        </div>
      </template>
      <template #content>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-purple-500/20">
            <span class="text-purple-300">Name:</span>
            <span class="text-white font-medium">{{ selectedAsteroid.name }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-purple-500/20">
            <span class="text-purple-300">Reference ID:</span>
            <span class="text-white">{{ selectedAsteroid.neo_reference_id }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-purple-500/20">
            <span class="text-purple-300">Absolute Magnitude:</span>
            <span class="text-white">{{ selectedAsteroid.absolute_magnitude_h }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-purple-300">Sentry Object:</span>
            <Badge
              :value="selectedAsteroid.is_sentry_object ? 'Yes' : 'No'"
              :severity="selectedAsteroid.is_sentry_object ? 'warning' : 'success'"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Size Estimates -->
    <Card class="bg-black/40 border border-purple-500/30">
      <template #title>
        <div class="flex items-center gap-2 text-white">
          <i class="pi pi-expand text-orange-400"></i>
          Size Estimates
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <div v-if="selectedAsteroid.estimated_diameter">
            <!-- Kilometers -->
            <div class="p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
              <h4 class="text-orange-300 font-medium mb-2">Kilometers</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-300">
                  Min:
                  {{
                    selectedAsteroid.estimated_diameter.kilometers?.estimated_diameter_min?.toFixed(
                      3,
                    )
                  }}
                  km
                </div>
                <div class="text-gray-300">
                  Max:
                  {{
                    selectedAsteroid.estimated_diameter.kilometers?.estimated_diameter_max?.toFixed(
                      3,
                    )
                  }}
                  km
                </div>
              </div>
            </div>

            <!-- Meters -->
            <div class="p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
              <h4 class="text-blue-300 font-medium mb-2">Meters</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-300">
                  Min:
                  {{
                    selectedAsteroid.estimated_diameter.meters?.estimated_diameter_min?.toFixed(1)
                  }}
                  m
                </div>
                <div class="text-gray-300">
                  Max:
                  {{
                    selectedAsteroid.estimated_diameter.meters?.estimated_diameter_max?.toFixed(1)
                  }}
                  m
                </div>
              </div>
            </div>

            <!-- Feet -->
            <div class="p-3 bg-green-900/20 rounded-lg border border-green-500/20">
              <h4 class="text-green-300 font-medium mb-2">Feet</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-300">
                  Min:
                  {{
                    selectedAsteroid.estimated_diameter.feet?.estimated_diameter_min?.toFixed(1)
                  }}
                  ft
                </div>
                <div class="text-gray-300">
                  Max:
                  {{
                    selectedAsteroid.estimated_diameter.feet?.estimated_diameter_max?.toFixed(1)
                  }}
                  ft
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
}

defineProps<Props>()
</script>
