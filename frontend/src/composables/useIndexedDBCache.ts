import { ref } from 'vue'
import type { Asteroid } from '@/types/asteroid'

const DB_NAME = 'asteroid_cache_db'
const STORE_NAME = 'asteroids'
const CACHE_VERSION = 1
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

interface CacheEntry {
  data: Asteroid[]
  timestamp: number
  version: number
}

/**
 * Sanitize asteroid data for IndexedDB storage
 * Removes any non-cloneable properties
 */
function sanitizeForStorage(asteroids: Asteroid[]): Asteroid[] {
  return asteroids.map(asteroid => {
    // Create a clean copy with only serializable properties
    return JSON.parse(JSON.stringify(asteroid))
  })
}

export function useIndexedDBCache() {
  const isCacheLoaded = ref(false)
  const cachedAsteroids = ref<Asteroid[]>([])

  // Open IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  // Load from IndexedDB
  const loadCache = async (): Promise<boolean> => {
    try {
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('asteroid_data')

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const cached = request.result as CacheEntry | undefined

          if (cached && 
              cached.version === CACHE_VERSION &&
              Date.now() - cached.timestamp < CACHE_DURATION) {
            cachedAsteroids.value = cached.data
            isCacheLoaded.value = true
            console.log(`✓ Loaded ${cached.data.length} asteroids from IndexedDB cache`)
            resolve(true)
          } else {
            if (cached) {
              console.log('IndexedDB cache expired, will refresh...')
            }
            resolve(false)
          }
        }

        request.onerror = () => {
          console.error('Failed to load from IndexedDB:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('IndexedDB load error:', error)
      return false
    }
  }

  // Save to IndexedDB
  const saveCache = async (asteroids: Asteroid[]): Promise<void> => {
    try {
      console.log('💾 Sanitizing data for IndexedDB...')
      
      // Sanitize the data to remove non-cloneable properties
      const sanitized = sanitizeForStorage(asteroids)
      
      console.log('💾 Saving to IndexedDB...')
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const cacheEntry: CacheEntry = {
        data: sanitized,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }

      const request = store.put(cacheEntry, 'asteroid_data')

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`✓ Saved ${asteroids.length} asteroids to IndexedDB cache`)
          resolve()
        }

        request.onerror = () => {
          console.error('Failed to save to IndexedDB:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('IndexedDB save error:', error)
      // Don't throw - caching is optional, app should still work
    }
  }

  // Clear cache
  const clearCache = async (): Promise<void> => {
    try {
      const db = await openDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      store.clear()
      cachedAsteroids.value = []
      isCacheLoaded.value = false
      console.log('IndexedDB cache cleared')
    } catch (error) {
      console.error('Failed to clear IndexedDB cache:', error)
    }
  }

  return {
    cachedAsteroids,
    isCacheLoaded,
    loadCache,
    saveCache,
    clearCache
  }
}