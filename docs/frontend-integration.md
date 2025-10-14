# Example: Integrating the Asteroid Composition API

## TypeScript/JavaScript Frontend Integration

### 1. Create an API service file

```typescript
// src/api/composition.ts
import axios from 'axios';

const COMPOSITION_API_URL = 'http://127.0.0.1:8157';

export interface AsteroidCompositionData {
  name: string;
  id: string;
  spectral_type?: string;
  albedo?: number;
  absolute_magnitude?: number;
  estimated_diameter_km?: number;
  orbital_period_days?: number;
  semi_major_axis_au?: number;
  eccentricity?: number;
  inclination_deg?: number;
  additional_data?: Record<string, any>;
}

export interface CompositionAnalysisResponse {
  asteroid_name: string;
  asteroid_id: string;
  analysis: string;
  model_used: string;
}

/**
 * Analyzes asteroid composition using AI
 * @param asteroidData - Asteroid data to analyze
 * @param streaming - Whether to use streaming response (default: false)
 */
export const analyzeComposition = async (
  asteroidData: AsteroidCompositionData,
  streaming: boolean = false
): Promise<CompositionAnalysisResponse> => {
  try {
    const response = await axios.post(`${COMPOSITION_API_URL}/analyze`, {
      asteroid: asteroidData,
      use_streaming: streaming,
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing asteroid composition:', error);
    throw error;
  }
};

/**
 * Analyzes composition with streaming (for real-time display)
 */
export const analyzeCompositionStreaming = (
  asteroidData: AsteroidCompositionData,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  const eventSource = new EventSource(
    `${COMPOSITION_API_URL}/analyze?${new URLSearchParams({
      asteroid: JSON.stringify(asteroidData),
      use_streaming: 'true',
    })}`
  );

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      onComplete();
      return;
    }

    try {
      const data = JSON.parse(event.data);
      if (data.content) {
        onChunk(data.content);
      } else if (data.error) {
        onError(new Error(data.error));
        eventSource.close();
      }
    } catch (e) {
      console.error('Error parsing SSE data:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    onError(new Error('Connection error'));
    eventSource.close();
  };

  return eventSource;
};
```

### 2. Usage in a Vue Component

```typescript
// src/components/AsteroidComposition.vue
<script setup lang="ts">
import { ref } from 'vue';
import { analyzeComposition, type AsteroidCompositionData } from '@/api/composition';

const props = defineProps<{
  asteroid: any; // Your existing asteroid type
}>();

const analysis = ref<string>('');
const loading = ref(false);
const error = ref<string | null>(null);

const analyzeAsteroid = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Map your asteroid data to the API format
    const asteroidData: AsteroidCompositionData = {
      name: props.asteroid.name,
      id: props.asteroid.id || props.asteroid.neo_reference_id,
      spectral_type: props.asteroid.spectral_type, // If available from SBDB
      albedo: props.asteroid.albedo,
      absolute_magnitude: props.asteroid.absolute_magnitude_h,
      estimated_diameter_km: props.asteroid.estimated_diameter?.kilometers?.estimated_diameter_max,
      // Add orbital parameters if available
    };

    const result = await analyzeComposition(asteroidData, false);
    analysis.value = result.analysis;
  } catch (err) {
    error.value = 'Failed to analyze asteroid composition';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="composition-analyzer">
    <h3>Asteroid Composition Analysis</h3>
    
    <button 
      @click="analyzeAsteroid" 
      :disabled="loading"
      class="analyze-button"
    >
      {{ loading ? 'Analyzing...' : 'Analyze Composition' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="analysis" class="analysis-result">
      <h4>Composition Analysis:</h4>
      <div class="analysis-content" v-html="formatAnalysis(analysis)"></div>
    </div>
  </div>
</template>

<style scoped>
.composition-analyzer {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 1rem 0;
}

.analyze-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.analyze-button:hover:not(:disabled) {
  background-color: #45a049;
}

.analyze-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.analysis-result {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.analysis-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.error {
  color: red;
  margin-top: 0.5rem;
}
</style>
```

### 3. Integration with Existing Components

Add to your `AsteroidDetails.vue` or create a new tab in your UI:

```typescript
// In your existing AsteroidDetails or similar component
import AsteroidComposition from './AsteroidComposition.vue';

// Then in template:
<AsteroidComposition :asteroid="selectedAsteroid" />
```

### 4. CORS Configuration

Make sure your Vite dev server proxies the API or update CORS origins in the backend `.env`:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/composition': {
        target: 'http://127.0.0.1:8157',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/composition/, ''),
      },
    },
  },
});
```

## Example API Call with cURL

```bash
# Non-streaming request
curl -X POST http://127.0.0.1:8157/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "asteroid": {
      "name": "1 Ceres",
      "id": "20000001",
      "spectral_type": "C",
      "albedo": 0.09,
      "absolute_magnitude": 3.34,
      "estimated_diameter_km": 939.4,
      "orbital_period_days": 1681.6,
      "semi_major_axis_au": 2.767,
      "eccentricity": 0.076,
      "inclination_deg": 10.59
    },
    "use_streaming": false
  }'
```

## Data Flow

1. User selects an asteroid in your frontend
2. Frontend fetches asteroid data from NASA APIs (NEO/SBDB)
3. Frontend sends asteroid data to composition API at `/analyze`
4. LLM analyzes the data and returns composition estimate
5. Frontend displays the analysis to the user

## Tips

- Use spectral type from SBDB API when available for better analysis
- The API works with minimal data (just name and ID) but provides better results with more parameters
- Consider caching results to avoid repeated API calls for the same asteroid
- Use streaming for better UX when displaying long analyses
