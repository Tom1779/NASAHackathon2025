import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { fetchSmallBodyData } from './api/sbdb'

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

app.mount('#app')
