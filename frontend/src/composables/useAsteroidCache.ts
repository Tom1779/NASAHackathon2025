import { ref, onMounted } from 'vue';
import type { Asteroid } from '@/types/asteroid';

const CACHE_KEY = 'asteroid_cache';
const CACHE_TIMESTAMP_KEY = 'asteroid_cache_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useAsteroidCache() {
  const cachedAsteroids = ref<Asteroid[]>([]);
  const isCacheLoaded = ref(false);

  const loadCache = () => {
    try {
      const timestampStr = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        if (Date.now() - timestamp < CACHE_DURATION) {
          const cachedData = localStorage.getItem(CACHE_KEY);
          if (cachedData) {
            cachedAsteroids.value = JSON.parse(cachedData);
            isCacheLoaded.value = true;
            console.log(`Loaded ${cachedAsteroids.value.length} asteroids from cache.`);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load asteroids from cache:', error);
      // Clear potentially corrupted cache
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
    isCacheLoaded.value = false;
  };

  const saveCache = (asteroids: Asteroid[]) => {
    try {
      if (asteroids.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(asteroids));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log(`Saved ${asteroids.length} asteroids to cache.`);
      }
    } catch (error) {
      console.error('Failed to save asteroids to cache:', error);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    cachedAsteroids.value = [];
    isCacheLoaded.value = false;
    console.log('Asteroid cache cleared.');
  };

  onMounted(() => {
    loadCache();
  });

  return {
    cachedAsteroids,
    isCacheLoaded,
    saveCache,
    clearCache,
  };
}
