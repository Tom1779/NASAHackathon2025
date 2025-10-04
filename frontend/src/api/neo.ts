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
    } catch (error) {
        console.error('Error fetching NEO details:', error);
        throw error;
    }
};