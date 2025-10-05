<template>
  <div v-if="selectedAsteroid" class="mt-8">
    <Card
      class="bg-gradient-to-br from-slate-900/80 to-gray-900/80 border border-yellow-500/30 shadow-2xl"
    >
      <template #title>
        <div class="flex items-center gap-3 text-white py-3">
          <div class="p-3 bg-yellow-500/20 rounded-full">
            <i class="pi pi-dollar text-yellow-400 text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-white">Economic Analysis</h2>
            <p class="text-gray-300 text-sm">{{ selectedAsteroid.name }} • Worth Estimation</p>
          </div>
        </div>
      </template>
      <template #content>
        <div class="space-y-6">
          <!-- Main Metrics Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Total Value -->
            <div
              class="bg-gradient-to-br from-emerald-900/40 to-green-800/40 p-6 rounded-xl border border-emerald-500/30 shadow-lg"
            >
              <div class="flex items-center gap-3 mb-3">
                <i class="pi pi-wallet text-emerald-400 text-2xl"></i>
                <div>
                  <h3 class="text-emerald-400 text-sm font-semibold uppercase tracking-wide">
                    Total Value
                  </h3>
                  <p class="text-emerald-300/70 text-xs">Market estimation</p>
                </div>
              </div>
              <div class="text-white text-3xl font-bold font-mono">
                {{ calculations?.formatValue(calculations.asterankPrice.value) || '$0' }}
              </div>
            </div>

            <!-- Profit Estimate -->
            <div
              class="bg-gradient-to-br from-purple-900/40 to-indigo-800/40 p-6 rounded-xl border border-purple-500/30 shadow-lg"
            >
              <div class="flex items-center gap-3 mb-3">
                <i class="pi pi-chart-line text-purple-400 text-2xl"></i>
                <div>
                  <h3 class="text-purple-400 text-sm font-semibold uppercase tracking-wide">
                    Est. Profit
                  </h3>
                  <p class="text-purple-300/70 text-xs">After mission costs</p>
                </div>
              </div>
              <div
                class="text-3xl font-bold font-mono text-right"
                :class="{
                  'text-green-400': (calculations?.asterankProfitValue?.value || 0) > 0,
                  'text-red-400': (calculations?.asterankProfitValue?.value || 0) <= 0,
                }"
              >
                {{
                  calculations?.formatValue(calculations.asterankProfitValue?.value || 0) || '$0'
                }}
              </div>
            </div>

            <!-- Spectral Type -->
            <div
              class="bg-gradient-to-br from-amber-900/40 to-yellow-800/40 p-6 rounded-xl border border-amber-500/30 shadow-lg"
            >
              <div class="flex items-center gap-3 mb-3">
                <i class="pi pi-tag text-amber-400 text-2xl"></i>
                <div>
                  <h3 class="text-amber-400 text-sm font-semibold uppercase tracking-wide">
                    Spectral Type
                  </h3>
                  <p class="text-amber-300/70 text-xs">Asteroid classification</p>
                </div>
              </div>
              <div class="text-white text-3xl font-bold">
                {{ getSpectralType() }}
              </div>
              <div v-if="getSpectralTypeName()" class="text-amber-300/70 text-sm mt-2">
                {{ getSpectralTypeName() }}
              </div>
            </div>
          </div>

          <!-- Material Composition -->
          <div
            class="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/30"
          >
            <div class="flex items-center gap-3 mb-6">
              <i class="pi pi-th-large text-indigo-400 text-xl"></i>
              <h3 class="text-white text-xl font-bold">
                {{
                  composition?.isUnknown?.value ? 'Possible Compositions' : 'Material Composition'
                }}
              </h3>
            </div>

            <!-- Known Composition -->
            <div
              v-if="
                !composition?.isUnknown?.value &&
                calculations?.materials.value &&
                calculations.materials.value.length > 0
              "
              class="space-y-3"
            >
              <div
                v-for="material in calculations.materials.value"
                :key="material?.material"
                class="bg-black/30 p-4 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all"
              >
                <div class="flex justify-between items-center">
                  <!-- Material Info -->
                  <div class="flex items-center gap-4">
                    <div
                      class="w-3 h-3 rounded-full"
                      :class="{
                        'bg-green-400': (material?.netProfit || 0) > 0,
                        'bg-yellow-400': (material?.netProfit || 0) === 0,
                        'bg-red-400': (material?.netProfit || 0) < 0,
                      }"
                    ></div>
                    <div>
                      <div class="text-white font-semibold">
                        {{ material?.info?.name || 'Unknown' }}
                      </div>
                      <div class="text-gray-400 text-sm">
                        {{ formatPercentage(material?.percentage || 0) }}% •
                        {{ calculations.formatMass(material?.mass || 0) }}
                      </div>
                    </div>
                  </div>

                  <!-- Value -->
                  <div class="text-right ml-4 flex-shrink-0 w-24">
                    <div
                      class="font-mono font-bold text-right"
                      :class="{
                        'text-green-400': (material?.netProfit || 0) > 0,
                        'text-yellow-400': (material?.netProfit || 0) === 0,
                        'text-red-400': (material?.netProfit || 0) < 0,
                      }"
                      style="
                        padding: 0 !important;
                        margin: 0 !important;
                        text-align: right !important;
                        display: block !important;
                        width: 100% !important;
                      "
                    >
                      {{ calculations.formatValue(material?.netProfit || 0) }}
                    </div>
                    <div class="text-gray-400 text-xs text-right">
                      ${{ (material?.pricePerKg || 0).toLocaleString() }}/kg
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Unknown Composition - Show Possible Types -->
            <div
              v-else-if="
                composition?.isUnknown?.value &&
                calculations?.unknownCompositionEstimates?.value &&
                calculations.unknownCompositionEstimates.value.length > 0
              "
              class="space-y-4"
            >
              <div class="bg-orange-900/20 p-4 rounded-lg border border-orange-500/30 mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-exclamation-triangle text-orange-400"></i>
                  <span class="text-orange-300 font-semibold">Spectral Type Unknown</span>
                </div>
                <p class="text-gray-300 text-sm">
                  Based on statistical distribution of asteroid belt populations, here are the
                  possible compositions and their estimated values:
                </p>
              </div>

              <div
                v-for="estimate in calculations?.unknownCompositionEstimates?.value || []"
                :key="estimate.spectralType"
                class="bg-black/30 p-4 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all"
              >
                <div class="flex justify-between items-center mb-3">
                  <!-- Type Info -->
                  <div class="flex items-center gap-4">
                    <div
                      class="w-3 h-3 rounded-full"
                      :class="{
                        'bg-green-400': estimate.profit > 0,
                        'bg-red-400': estimate.profit <= 0,
                      }"
                    ></div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-white font-bold">{{ estimate.spectralType }}-type</span>
                        <span class="text-gray-400">{{ estimate.displayName }}</span>
                        <span
                          class="px-2 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full border border-blue-500/30"
                        >
                          ~{{ estimate.probability }}% probability
                        </span>
                      </div>
                      <div class="text-gray-400 text-sm">
                        Mass: {{ calculations?.formatMass(estimate.mass) }}
                      </div>
                    </div>
                  </div>

                  <!-- Values -->
                  <div class="text-right ml-4 flex-shrink-0 w-24">
                    <div
                      class="font-mono font-bold text-right"
                      :class="{
                        'text-green-400': estimate.profit > 0,
                        'text-red-400': estimate.profit <= 0,
                      }"
                      style="
                        padding: 0 !important;
                        margin: 0 !important;
                        text-align: right !important;
                        display: block !important;
                        width: 100% !important;
                      "
                    >
                      {{ calculations?.formatValue(estimate.profit) }}
                    </div>
                    <div class="text-gray-400 text-xs text-right">
                      Total: {{ calculations?.formatValue(estimate.totalValue) }}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- No Data -->
            <div v-else class="text-center py-8">
              <i class="pi pi-info-circle text-4xl text-gray-500 mb-3 block"></i>
              <p class="text-gray-400">No composition data available</p>
            </div>
          </div>

          <!-- Mission Viability -->
          <div
            class="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border border-blue-500/30"
          >
            <div class="flex items-center gap-3 mb-4">
              <i class="pi pi-compass text-blue-400 text-xl"></i>
              <h3 class="text-white text-xl font-bold">Mission Assessment</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-black/30 p-4 rounded-lg text-center">
                <div class="text-blue-400 text-sm uppercase tracking-wide mb-1">Accessibility</div>
                <div class="text-white text-2xl font-bold font-mono">
                  {{ calculations?.closenessWeight.value.toFixed(1) || '0' }}
                </div>
                <div class="text-blue-300/70 text-xs">Lower is better</div>
              </div>

              <div class="bg-black/30 p-4 rounded-lg text-center">
                <div class="text-blue-400 text-sm uppercase tracking-wide mb-1">Viability</div>
                <div
                  class="w-3 h-3 rounded-full mx-auto mb-2"
                  :class="{
                    'bg-green-400': calculations?.isViable.value,
                    'bg-red-400': !calculations?.isViable.value,
                  }"
                ></div>
                <div class="text-white font-semibold text-center w-full">
                  {{ calculations?.viabilityRating.value || 'Unknown' }}
                </div>
              </div>

              <div class="bg-black/30 p-4 rounded-lg text-center">
                <div class="text-blue-400 text-sm uppercase tracking-wide mb-1">Est. Mass</div>
                <div class="text-white text-xl font-bold font-mono">
                  {{ calculations?.formatMass(calculations.totalMass.value) || 'Unknown' }}
                </div>
                <div class="text-blue-300/70 text-xs">
                  {{ calculations?.diameter.value.toFixed(1) || '?' }} km diameter
                </div>
              </div>
            </div>
          </div>

          <!-- Methodology Note -->
          <div
            class="bg-gradient-to-r from-gray-800/50 to-slate-800/50 p-4 rounded-lg border border-gray-600/30"
          >
            <div class="flex items-start gap-3">
              <i class="pi pi-info-circle text-gray-400 mt-1"></i>
              <div class="text-sm">
                <p class="text-gray-300 mb-1">
                  <strong>Methodology:</strong> Based on Asterank scientific algorithms using
                  spectral composition, 2025 market prices, and orbital accessibility factors.
                </p>
                <p class="text-gray-400 text-xs">
                  Estimates include space delivery premiums and mission complexity adjustments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import type { Asteroid } from '../types/asteroid'
import { useComposition } from '../composables/useComposition'
import { useAsteroidCalculations } from '../composables/useAsteroidCalculations'

// Component props
interface Props {
  selectedAsteroid: Asteroid | null
}

const props = defineProps<Props>()

// Get composition data for the selected asteroid
const composition = computed(() => {
  if (!props.selectedAsteroid) return null
  return useComposition(props.selectedAsteroid)
})

// Get calculation results for the selected asteroid
const calculations = computed(() => {
  if (!props.selectedAsteroid) return null
  return useAsteroidCalculations(props.selectedAsteroid)
})

// Format percentage with appropriate precision for small values
const formatPercentage = (percentage: string | number): string => {
  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage
  if (isNaN(num) || num === 0) return '0.0'

  if (num >= 1) return num.toFixed(1)
  if (num >= 0.1) return num.toFixed(2)
  if (num >= 0.01) return num.toFixed(3)
  if (num > 0) return num.toFixed(4)

  return '0.0'
}

// Get the spectral type from asteroid data
const getSpectralType = (): string => {
  if (!props.selectedAsteroid) return 'Unknown'

  // Try SMASSII first, then Tholen classification
  const spectralType =
    props.selectedAsteroid.smassii_spectral_type || props.selectedAsteroid.tholen_spectral_type

  if (spectralType) {
    // Extract the main type (first letter) for display
    return spectralType.charAt(0).toUpperCase()
  }

  return 'Unknown'
}

// Get the display name for the spectral type
const getSpectralTypeName = (): string => {
  if (!props.selectedAsteroid) return ''

  const spectralType = getSpectralType()

  if (spectralType === 'Unknown') return ''

  // Get the display name from composition data
  const compositionData = composition.value?.composition.value
  if (compositionData && 'displayName' in compositionData) {
    return compositionData.displayName
  }

  // Fallback display names
  const typeNames: Record<string, string> = {
    C: 'Carbonaceous',
    S: 'Stony',
    M: 'Metallic',
    B: 'Low-Albedo Carbonaceous',
    X: 'Metallic/M-type',
    V: 'Basaltic',
    A: 'Olivine-rich',
    D: 'Red, organic-rich',
    T: 'Trojan-type',
    P: 'Dark, reddish',
  }

  return typeNames[spectralType] || ''
}
</script>
