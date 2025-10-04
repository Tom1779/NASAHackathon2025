import axios from 'axios';

const NASA_API_KEY = 'Whi7dNeG5uq4kAEi32jBPh2gIEGtibszuSk1fdgT'; 
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

/**
 * Fetches Near Earth Objects (NEOs) for a given date range.
 * @param startDate - The start date in YYYY-MM-DD format.
 * @param endDate - The end date in YYYY-MM-DD format.
 * @returns A promise resolving to the NEO data.
 */
export const fetchNeoData = async (startDate: string, endDate: string) => {
    try {
        const url = `${BASE_URL}/feed`;
        const params = {
            start_date: startDate,
            end_date: endDate,
            api_key: NASA_API_KEY,
        };
        console.log('Sending request to NEO feed API:', { url, params });
        const response = await axios.get(url, { params });
        // The feed response groups NEOs by date under `near_earth_objects`
        const data = response.data;
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
        const response = await axios.get(`${BASE_URL}/neo/${neoId}`, {
            params: {
                api_key: NASA_API_KEY,
            },
            
        });
        const url = `${BASE_URL}/neo/${neoId}`;
        const params = { api_key: NASA_API_KEY };
        console.log('Sending request to NEO details API:', { url, params });
        const data = response.data;
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
 * Browse the entire NEO dataset via the NeoWs `browse` endpoint.
 * This function will page through results until it has fetched every page.
 * WARNING: This will make many requests and can hit NASA rate limits. Use with care.
 * @param delayMs - milliseconds to wait between pages (default 250ms)
 */
export const fetchNeoBrowse = async (delayMs = 250) => {
    const url = `${BASE_URL}/neo/browse`;
    let page = 0;
    let allItems: any[] = [];

    try {
        while (true) {
            const params = { page, api_key: NASA_API_KEY };
            console.log('Requesting NEO browse page', page, { url, params });
            const resp = await axios.get(url, { params });
            const data = resp.data;
            const items = data?.near_earth_objects || [];
            if (!Array.isArray(items) || items.length === 0) break;
            allItems = allItems.concat(items);

            // If the returned page has fewer items than the per_page, it's the last page
            const perPage = data?.page?.size || items.length;
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