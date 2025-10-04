import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { fetchSmallBodyData } from './api/sbdb'
import { fetchNeoData, fetchNeoDetails, fetchNeoBrowse } from './api/neo'

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
    console.warn('Starting full NEO browse. This will issue many requests and may hit NASA rate limits. Proceed with caution.')
    const all = await fetchNeoBrowse(250) // 250ms delay between pages by default
    console.log('NEO browse completed. Total asteroids fetched:', (all?.near_earth_objects || []).length)
    // Optionally fetch details for the first few
    const items = all?.near_earth_objects || []
    if (items.length > 0) {
      const firstAny: any = items[0]
      if (firstAny.id) {
        const details = await fetchNeoDetails(String(firstAny.id))
        console.log('Example NEO details:', details?.id, details?.name)
      }
    }
  } catch (err) {
    console.error('Error during full NEO browse:', err)
  }
}

testNeoApi()

app.mount('#app')
