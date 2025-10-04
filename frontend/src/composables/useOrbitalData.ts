/**
 * Composable for fetching and managing asteroid orbital data from SBDB
 */

import { ref, type Ref } from 'vue';
import { fetchSmallBodyData } from '../api/sbdb';
import { parseSbdbOrbitalElements, calculateOrbitalPeriod } from '../utils/orbitalMechanics';
import type { OrbitalData, SbdbData } from '../types/asteroid';

export interface UseOrbitalDataReturn {
  orbitalData: Ref<OrbitalData | null>;
  sbdbData: Ref<SbdbData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchOrbitalData: (asteroidId: string) => Promise<void>;
}

export function useOrbitalData(): UseOrbitalDataReturn {
  const orbitalData = ref<OrbitalData | null>(null);
  const sbdbData = ref<SbdbData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchOrbitalData = async (asteroidId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    orbitalData.value = null;
    sbdbData.value = null;

    try {
      // Clean the asteroid ID (remove parentheses and extra characters)
      const cleanId = asteroidId
        .replace(/[()]/g, '')
        .trim();

      console.log('Fetching SBDB data for:', cleanId);
      const data = await fetchSmallBodyData(cleanId);

      sbdbData.value = data as SbdbData;

      // Parse orbital elements
      const elements = parseSbdbOrbitalElements(data);

      if (!elements) {
        throw new Error('Could not parse orbital elements from SBDB data');
      }

      // Calculate orbital period if semi-major axis is available
      const period = elements.a ? calculateOrbitalPeriod(elements.a) : undefined;

      orbitalData.value = {
        ...elements,
        period
      };

      console.log('Parsed orbital data:', orbitalData.value);
    } catch (err) {
      console.error('Error fetching orbital data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch orbital data';
    } finally {
      loading.value = false;
    }
  };

  return {
    orbitalData,
    sbdbData,
    loading,
    error,
    fetchOrbitalData
  };
}
