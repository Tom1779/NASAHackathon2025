import axios from 'axios';

const BASE_URL = 'https://ssd-api.jpl.nasa.gov';

export interface SbdbResponse {
    [key: string]: any;
}

// fetchSingleObject: queries the single-object endpoint `sbdb.api` which accepts `sstr` values
// Example: https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Ceres
// We proxy /api/sbdb locally to the above via Vite dev server.
export const fetchSmallBodyData = async (objectId: string): Promise<SbdbResponse> => {
    try {
        const params = { sstr: objectId };
        const url = `/api/sbdb`;
        console.log('Sending request to SBDB API:', { url, params });
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.error('SBDB API responded with an error:', {
                status: error.response.status,
                data: error.response.data,
            });
        } else {
            console.error('Error fetching small body data:', error.message || error);
        }
        throw error;
    }
};