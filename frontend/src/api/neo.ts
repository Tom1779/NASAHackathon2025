import axios from 'axios';

// API Key rotation system
const API_KEYS = [
  import.meta.env.VITE_NASA_API_KEY,
  import.meta.env.VITE_NASA_API_KEY_2,
  'DEMO_KEY' // Fallback
].filter(Boolean); // Remove any undefined/null values

let currentKeyIndex = 0;

const getNextApiKey = (): string => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Rotating to API key #${currentKeyIndex + 1}`);
  return API_KEYS[currentKeyIndex];
};

const getCurrentApiKey = (): string => {
  return API_KEYS[currentKeyIndex] || 'DEMO_KEY';
};

const BASE_URL = import.meta.env.VITE_NASA_NEO_BASE_URL || 'https://api.nasa.gov/neo/rest/v1';

// Log warning if using fallback API key
if (API_KEYS.length === 1 && API_KEYS[0] === 'DEMO_KEY') {
  console.warn('No NASA API keys found in environment, using DEMO_KEY (heavily rate limited)');
} else {
  console.log(`Initialized with ${API_KEYS.length} API key(s)`);
}

/**
 * Make an API request with automatic key rotation on rate limit errors
 * @param url - The API endpoint URL
 * @param params - Query parameters (without api_key)
 * @param maxRetries - Maximum number of key rotations to attempt
 */
const makeApiRequestWithRotation = async (url: string, params: Record<string, any>, maxRetries = API_KEYS.length): Promise<any> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = getCurrentApiKey();
      const response = await axios.get(url, {
        params: { ...params, api_key: apiKey }
      });
      return response.data;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429) or similar
      if (error?.response?.status === 429 || error?.response?.status === 403) {
        console.warn(`Rate limit hit with API key #${currentKeyIndex + 1}, rotating to next key...`);
        getNextApiKey();
        
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted all keys, throw the last error
  console.error('All API keys exhausted or rate limited');
  throw lastError;
};

/**
 * Fetches Near Earth Objects (NEOs) for a given date range.
 * @param startDate - The start date in YYYY-MM-DD format.
 * @param endDate - The end date in YYYY-MM-DD format.
 * @returns A promise resolving to the NEO data.
 */
export const fetchNeoData = async (startDate: string, endDate: string) => {
    try {
        const url = '/api/neo/feed';
        const params = {
            start_date: startDate,
            end_date: endDate,
        };
        console.log('Sending request to NEO feed API:', { url, params });
        const data = await makeApiRequestWithRotation(url, params);
        try {
            const grouped = data?.near_earth_objects;
            const items = Array.isArray(grouped) ? grouped : (grouped ? Object.values(grouped).flat() : []);
            items.forEach((it: any) => {
                const name = it?.name || it?.full_name || it?.designation || it?.id || 'Unknown NEO';
                console.log('NEO feed item name:', name);
            });
        } catch (e) {
            // Non-fatal logging error
            console.warn('Failed to extract NEO names from feed response', e);
        }

        return data;
    } catch (error) {
        console.error('Error fetching NEO data:', error);
        throw error;
    }
};

/**
 * Fetches details for a specific NEO by its ID.
 * @param neoId - The ID of the NEO.
 * @returns A promise resolving to the NEO details.
 */
export const fetchNeoDetails = async (neoId: string) => {
    try {
        const url = `/api/neo/neo/${neoId}`;
        const params = {};
        console.log('Sending request to NEO details API:', { url, params });
        const data = await makeApiRequestWithRotation(url, params);
        try {
            const name = data?.name || data?.full_name || data?.designation || data?.id || 'Unknown NEO';
            console.log('NEO details result name:', name, { id: neoId });
        } catch (e) {
            console.warn('Failed to extract NEO name from details response', e);
        }
        return data;
    } catch (error: any) {
        // If the NEO endpoint returns 404 it's likely the object isn't in
        // the NeoWs dataset (for example: many main-belt asteroids). Log a
        // non-fatal warning and rethrow so callers can handle gracefully.
        if (error?.response?.status === 404) {
            console.warn('NEO details not found (404) for id:', neoId)
        } else {
            console.error('Error fetching NEO details:', error);
        }
        throw error;
    }
};

/**
 * Browse NEO dataset with pagination support for the asteroid selector
 * @param page - page number (0-based)
 * @param size - items per page (default 20, max 100)
 */
export const fetchNeoBrowsePage = async (page = 0, size = 100) => {
    try {
        const url = '/api/neo/neo/browse';
        const params = {
            page,
            size: Math.min(size, 100), // NASA API max is 100
        };
        console.log('Requesting NEO browse page:', { url, params });
        return await makeApiRequestWithRotation(url, params);
    } catch (error) {
        console.error('Error fetching NEO browse page:', error);
        throw error;
    }
};

/**
 * Browse NEOs with pagination - let the API handle pagination, we'll do client-side search
 * @param page - page number (0-based)
 * @param size - items per page
 */
export const browseNeos = async (page = 0, size = 100) => {
    return fetchNeoBrowsePage(page, size);
};

/**
 * Search NEOs by name or ID - for now we'll fetch and filter client-side
 * In a production app, you'd want server-side search if the API supports it
 * @param query - search query
 * @param page - page number (0-based)
 * @param size - items per page
 */
export const searchNeos = async (query: string, page = 0, size = 100) => {
    try {
        // For search, we fetch the current page and filter client-side
        // The NASA NEO browse API doesn't have built-in search parameters
        const data = await fetchNeoBrowsePage(page, size);

        if (!query.trim()) {
            return data; // Return all results if no query
        }        const queryLower = query.toLowerCase();
        const filteredItems = (data.near_earth_objects || []).filter((neo: any) => {
            const name = (neo.name || '').toLowerCase();
            const id = String(neo.id || '');
            const refId = String(neo.neo_reference_id || '');

            return name.includes(queryLower) ||
                   id.includes(query) ||
                   refId.includes(query);
        });

        return {
            ...data,
            near_earth_objects: filteredItems,
            // Keep original pagination info for API-level pagination
            page: data.page,
            // Add search metadata
            search: {
                query,
                total_filtered: filteredItems.length,
                total_on_page: (data.near_earth_objects || []).length
            }
        };
    } catch (error) {
        console.error('Error searching NEOs:', error);
        throw error;
    }
};

/**
 * Browse the entire NEO dataset via the NeoWs `browse` endpoint.
 * This function will page through results until it has fetched every page.
 * WARNING: This will make many requests and can hit NASA rate limits. Use with care.
 * @param delayMs - milliseconds to wait between pages (default 250ms)
 */
export const fetchNeoBrowse = async (delayMs = 250) => {
    const url = '/api/neo/neo/browse';
    let page = 0;
    let allItems: any[] = [];

    try {
        while (true) {
            const params = { page };
            console.log('Requesting NEO browse page', page, { url, params });
            const data = await makeApiRequestWithRotation(url, params);
            const items = data?.near_earth_objects || [];
            if (!Array.isArray(items) || items.length === 0) break;
            allItems = allItems.concat(items);

            // If the returned page has fewer items than the per_page, it's the last page
            const total = data?.page?.total_elements || null;
            if (total !== null && allItems.length >= total) break;

            page += 1;
            // Small delay to avoid hitting rate limits
            await new Promise((res) => setTimeout(res, delayMs));
        }

        console.log('Completed NEO browse. Total items fetched:', allItems.length);
        return { near_earth_objects: allItems };
    } catch (error) {
        console.error('Error browsing NEO dataset:', error);
        throw error;
    }
}
