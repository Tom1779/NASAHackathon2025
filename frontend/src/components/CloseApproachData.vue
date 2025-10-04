<template>
  <Card
    v-if="selectedAsteroid?.close_approach_data?.length"
    class="bg-black/40 border border-purple-500/30 lg:col-span-2"
  >
    <template #title>
      <div class="flex items-center gap-2 text-white">
        <i class="pi pi-calendar text-red-400"></i>
        Close Approach Data
      </div>
    </template>
    <template #content>
      <div class="overflow-x-auto">
        <DataTable
          :value="selectedAsteroid.close_approach_data"
          class="p-datatable-sm responsive-table"
          :paginator="selectedAsteroid.close_approach_data.length > 5"
          :rows="5"
        >
          <Column field="close_approach_date" header="Date">
            <template #body="{ data }">
              <Badge :value="data.close_approach_date" severity="info" />
            </template>
          </Column>
          <Column field="orbiting_body" header="Orbiting Body">
            <template #body="{ data }">
              <span class="text-yellow-400">{{ data.orbiting_body }}</span>
            </template>
          </Column>
          <Column header="Velocity (km/h)">
            <template #body="{ data }">
              {{ Number(data.relative_velocity?.kilometers_per_hour || 0).toLocaleString() }}
            </template>
          </Column>
          <Column header="Miss Distance (km)">
            <template #body="{ data }">
              {{ Number(data.miss_distance?.kilometers || 0).toLocaleString() }}
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'
import type { Asteroid } from '../types/asteroid'

interface Props {
  selectedAsteroid: Asteroid | null
}

defineProps<Props>()
</script>
