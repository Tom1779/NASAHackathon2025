import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { fetchSmallBodyData } from './api/sbdb'
import { fetchNeoData, fetchNeoDetails } from './api/neo'

import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
})

// Make a mock query to the SBDB API and log the result to the console
const testSbdbApi = async () => {
  try {
    const objectId = 'Ceres'; // Example object ID
    const data = await fetchSmallBodyData(objectId);
    console.log('Mock SBDB API Query Result:', data);
  } catch (error) {
    console.error('Error during mock SBDB API query:', error);
  }
};

testSbdbApi();

// Make sample NEO API queries during development so the console shows NEO logs
const testNeoApi = async () => {
  try {
    // Use a small date range to keep the response small
    const start = '2023-09-01'
    const end = '2023-09-02'
    const feed = await fetchNeoData(start, end)
    console.log('Mock NEO feed Query Result (summary):', { dates: Object.keys(feed?.near_earth_objects || {}) })

    // If there's at least one NEO id available, fetch details for the first one
    const grouped = feed?.near_earth_objects
    const items = grouped ? Object.values(grouped).flat() : []
    const first = items[0]
    if (first) {
      const firstAny: any = first
      if (firstAny.id) {
        const details = await fetchNeoDetails(firstAny.id)
        console.log('Mock NEO details Query Result (id):', details?.id)
      }
    }
  } catch (err) {
    console.error('Error during mock NEO API query:', err)
  }
}

testNeoApi()

app.mount('#app')
