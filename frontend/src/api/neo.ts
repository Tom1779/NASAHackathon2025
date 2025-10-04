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
        const response = await axios.get(`${BASE_URL}/feed`, {
            params: {
                start_date: startDate,
                end_date: endDate,
                api_key: NASA_API_KEY,
            },
        });
        return response.data;
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
        return response.data;
    } catch (error) {
        console.error('Error fetching NEO details:', error);
        throw error;
    }
};