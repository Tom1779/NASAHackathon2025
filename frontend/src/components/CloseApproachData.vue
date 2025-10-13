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

<style scoped>
/* Small screens - focus on date badge and cell spacing */
@media (max-width: 600px) {
  :deep(.p-badge) {
    font-size: 0.45rem !important;
    padding: 0.1rem 0.2rem !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 80px !important;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.3rem 0.1rem !important;
    font-size: 0.7rem;
  }
  
  /* First column (date) needs more right spacing */
  :deep(.p-datatable .p-datatable-tbody > tr > td:first-child) {
    padding: 0.3rem 0.4rem 0.3rem 0.1rem !important;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.3rem 0.1rem !important;
    font-size: 0.65rem;
  }
  
  /* First header needs more right spacing too */
  :deep(.p-datatable .p-datatable-thead > tr > th:first-child) {
    padding: 0.3rem 0.4rem 0.3rem 0.1rem !important;
  }
}

/* Ultra small screens - even more aggressive spacing */
@media (max-width: 406px) {
  :deep(.p-badge) {
    font-size: 0.4rem !important;
    padding: 0.05rem 0.15rem !important;
    max-width: 60px !important;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.2rem 0.05rem !important;
    font-size: 0.6rem;
  }
  
  /* First column (date) needs some right spacing even on tiny screens */
  :deep(.p-datatable .p-datatable-tbody > tr > td:first-child) {
    padding: 0.2rem 0.25rem 0.2rem 0.05rem !important;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.2rem 0.05rem !important;
    font-size: 0.55rem;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th:first-child) {
    padding: 0.2rem 0.25rem 0.2rem 0.05rem !important;
  }
}
</style>
