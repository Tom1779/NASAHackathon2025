#!/usr/bin/env node

/**
 * NEO Data Fetcher - Collects all asteroid data from NASA NEO API
 * 
 * Features:
 * - Uses 5 API keys with rotation to avoid rate limits
 * - Implements exponential backoff for failed requests
 * - Saves progress checkpoints to resume if interrupted
 * - Fetches all ~40,000 asteroids from the browse endpoint
 * - Stores data in a single JSON file
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
    BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
    API_KEYS: [
        process.env.NASA_API_KEY1,
        process.env.NASA_API_KEY2, 
        process.env.NASA_API_KEY3,
        process.env.NASA_API_KEY4,
        process.env.NASA_API_KEY5
    ].filter(Boolean),
    OUTPUT_FILE: path.join(__dirname, '../src/data/all_neo_data.json'),
    CHECKPOINT_FILE: path.join(__dirname, '../src/data/neo_fetch_checkpoint.json'),
    ITEMS_PER_PAGE: 20, // NASA API default
    DELAY_BETWEEN_REQUESTS: 500, // Base delay in ms
    MAX_RETRIES: 3,
    BACKOFF_MULTIPLIER: 2
};

// State management
let state = {
    currentKeyIndex: 0,
    totalFetched: 0,
    allNeos: [],
    currentPage: 0,
    isComplete: false,
    errors: [],
    startTime: Date.now()
};

/**
 * Get current API key
 */
function getCurrentApiKey() {
    return CONFIG.API_KEYS[state.currentKeyIndex];
}

/**
 * Rotate to next API key
 */
function rotateApiKey() {
    state.currentKeyIndex = (state.currentKeyIndex + 1) % CONFIG.API_KEYS.length;
    console.log(`🔄 Rotated to API key #${state.currentKeyIndex + 1}`);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt) {
    return CONFIG.DELAY_BETWEEN_REQUESTS * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt);
}

/**
 * Save checkpoint to resume later if needed
 */
async function saveCheckpoint() {
    const checkpoint = {
        ...state,
        timestamp: Date.now(),
        allNeos: [] // Don't save the full data in checkpoint, just progress
    };
    
    try {
        await fs.writeFile(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
        console.log(`💾 Checkpoint saved: Page ${state.currentPage}, Total: ${state.totalFetched}`);
    } catch (error) {
        console.error('❌ Failed to save checkpoint:', error.message);
    }
}

/**
 * Save current NEO data to JSON file (incremental saves)
 */
async function saveCurrentNeoData() {
    const currentData = {
        metadata: {
            total_count: state.totalFetched,
            current_page: state.currentPage,
            fetch_date: new Date().toISOString(),
            fetch_duration_ms: Date.now() - state.startTime,
            api_keys_used: CONFIG.API_KEYS.length,
            errors_count: state.errors.length,
            is_complete: state.isComplete,
            last_updated: new Date().toISOString()
        },
        errors: state.errors,
        near_earth_objects: state.allNeos
    };
    
    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG.OUTPUT_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    try {
        await fs.writeFile(CONFIG.OUTPUT_FILE, JSON.stringify(currentData, null, 2));
        console.log(`💾 Saved ${state.totalFetched} NEOs to JSON file`);
    } catch (error) {
        console.error('❌ Failed to save NEO data:', error.message);
    }
}

/**
 * Load checkpoint if exists and try to load existing NEO data
 */
async function loadCheckpoint() {
    try {
        const data = await fs.readFile(CONFIG.CHECKPOINT_FILE, 'utf8');
        const checkpoint = JSON.parse(data);
        
        // Restore state except for allNeos array (we'll load it from JSON file)
        state.currentPage = checkpoint.currentPage || 0;
        state.totalFetched = checkpoint.totalFetched || 0;
        state.currentKeyIndex = checkpoint.currentKeyIndex || 0;
        state.errors = checkpoint.errors || [];
        
        // Try to load existing NEO data from JSON file
        try {
            const existingData = await fs.readFile(CONFIG.OUTPUT_FILE, 'utf8');
            const jsonData = JSON.parse(existingData);
            state.allNeos = jsonData.near_earth_objects || [];
            console.log(`📂 Loaded ${state.allNeos.length} existing NEOs from JSON file`);
        } catch (error) {
            console.log('📂 No existing JSON data found, starting fresh NEO collection');
            state.allNeos = [];
        }
        
        console.log(`📂 Resumed from checkpoint: Page ${state.currentPage}, Total: ${state.totalFetched}`);
        return true;
    } catch (error) {
        console.log('📂 No checkpoint found, starting fresh');
        state.allNeos = [];
        return false;
    }
}

/**
 * Make API request with retry logic and key rotation
 */
async function makeApiRequest(url, params, attempt = 0) {
    const apiKey = getCurrentApiKey();
    
    try {
        console.log(`📡 Requesting page ${state.currentPage} (Key #${state.currentKeyIndex + 1}, Attempt ${attempt + 1})`);
        
        const response = await axios.get(url, {
            params: { ...params, api_key: apiKey },
            timeout: 30000 // 30 second timeout
        });
        
        return response.data;
        
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.error_message || error.message;
        
        console.error(`❌ Request failed (Status: ${status}): ${message}`);
        
        // Handle rate limiting
        if (status === 429 || status === 403) {
            console.log('⚠️  Rate limit hit, rotating API key...');
            rotateApiKey();
            
            // If we've tried all keys, wait longer
            if (state.currentKeyIndex === 0) {
                const waitTime = getBackoffDelay(attempt) * CONFIG.API_KEYS.length;
                console.log(`⏱️  Waiting ${waitTime}ms before retrying...`);
                await sleep(waitTime);
            }
        }
        
        // Retry logic
        if (attempt < CONFIG.MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.log(`🔄 Retrying in ${delay}ms...`);
            await sleep(delay);
            return makeApiRequest(url, params, attempt + 1);
        }
        
        // Max retries exceeded
        state.errors.push({
            page: state.currentPage,
            error: message,
            timestamp: Date.now()
        });
        
        throw new Error(`Max retries exceeded for page ${state.currentPage}: ${message}`);
    }
}

/**
 * Fetch a single page of NEO data
 */
async function fetchNeoPage(page) {
    const url = `${CONFIG.BASE_URL}/neo/browse`;
    const params = { page };
    
    const data = await makeApiRequest(url, params);
    
    if (!data || !data.near_earth_objects) {
        throw new Error(`Invalid response format for page ${page}`);
    }
    
    return data;
}

/**
 * Process and validate NEO data
 */
function processNeoData(neos) {
    return neos.map(neo => ({
        // Core NEO data
        id: neo.id,
        neo_reference_id: neo.neo_reference_id,
        name: neo.name,
        nasa_jpl_url: neo.nasa_jpl_url,
        absolute_magnitude_h: neo.absolute_magnitude_h,
        estimated_diameter: neo.estimated_diameter,
        is_potentially_hazardous_asteroid: neo.is_potentially_hazardous_asteroid,
        close_approach_data: neo.close_approach_data || [],
        is_sentry_object: neo.is_sentry_object,
        links: neo.links,
        
        // Add fetch metadata
        fetched_at: new Date().toISOString()
    }));
}

/**
 * Save final data to JSON file
 */
async function saveNeoData() {
    const finalData = {
        metadata: {
            total_count: state.totalFetched,
            fetch_date: new Date().toISOString(),
            fetch_duration_ms: Date.now() - state.startTime,
            api_keys_used: CONFIG.API_KEYS.length,
            errors_count: state.errors.length
        },
        errors: state.errors,
        near_earth_objects: state.allNeos
    };
    
    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG.OUTPUT_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save data
    await fs.writeFile(CONFIG.OUTPUT_FILE, JSON.stringify(finalData, null, 2));
    console.log(`💾 Saved ${state.totalFetched} NEOs to ${CONFIG.OUTPUT_FILE}`);
    
    // Clean up checkpoint file
    try {
        await fs.unlink(CONFIG.CHECKPOINT_FILE);
        console.log('🧹 Cleaned up checkpoint file');
    } catch (error) {
        // Ignore if file doesn't exist
    }
}

/**
 * Display progress information
 */
function displayProgress(pageData) {
    const elapsed = (Date.now() - state.startTime) / 1000;
    const rate = state.totalFetched / elapsed;
    
    console.log(`📊 Progress: ${state.totalFetched} NEOs fetched`);
    console.log(`⏱️  Time elapsed: ${elapsed.toFixed(1)}s`);
    console.log(`🚀 Rate: ${rate.toFixed(1)} NEOs/sec`);
    
    if (pageData?.page) {
        const total = pageData.page.total_elements;
        const pages = pageData.page.total_pages;
        if (total && pages) {
            const progress = ((state.currentPage + 1) / pages * 100).toFixed(1);
            console.log(`📄 Page ${state.currentPage + 1}/${pages} (${progress}%)`);
            console.log(`🎯 Total estimated: ${total} NEOs`);
        }
    }
    
    console.log('─'.repeat(50));
}

/**
 * Main fetch function
 */
async function fetchAllNeoData() {
    console.log('🚀 Starting NEO data fetch...');
    console.log(`🔑 Using ${CONFIG.API_KEYS.length} API keys`);
    
    // Initialize
    await loadCheckpoint();
    state.startTime = Date.now();
    
    // Create initial JSON file if starting fresh
    if (state.currentPage === 0 && state.allNeos.length === 0) {
        await saveCurrentNeoData();
        console.log('📄 Created initial JSON file');
    }
    
    try {
        while (!state.isComplete) {
            // Add delay between requests
            if (state.currentPage > 0) {
                await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
            }
            
            try {
                const pageData = await fetchNeoPage(state.currentPage);
                const neos = pageData.near_earth_objects || [];
                
                if (neos.length === 0) {
                    console.log('✅ No more data available, fetch complete');
                    state.isComplete = true;
                    break;
                }
                
                // Process and add NEOs
                const processedNeos = processNeoData(neos);
                state.allNeos.push(...processedNeos);
                state.totalFetched += processedNeos.length;
                state.currentPage++;
                
                // Display progress
                displayProgress(pageData);
                
                // Save checkpoint and data every 10 pages
                if (state.currentPage % 10 === 0) {
                    await saveCheckpoint();
                    await saveCurrentNeoData();
                }
                
                // Check if we've reached the end based on pagination info
                if (pageData.page && pageData.page.total_pages) {
                    if (state.currentPage >= pageData.page.total_pages) {
                        console.log('✅ Reached last page, fetch complete');
                        state.isComplete = true;
                    }
                }
                
            } catch (error) {
                console.error(`❌ Failed to fetch page ${state.currentPage}:`, error.message);
                
                // Continue to next page unless it's a critical error
                if (error.message.includes('Max retries exceeded')) {
                    console.log('⏭️  Skipping failed page and continuing...');
                    state.currentPage++;
                } else {
                    throw error; // Re-throw critical errors
                }
            }
        }
        
        // Save final data
        state.isComplete = true;
        await saveCurrentNeoData();
        
        // Final summary
        const elapsed = (Date.now() - state.startTime) / 1000;
        console.log('\n🎉 Fetch completed successfully!');
        console.log(`📊 Total NEOs fetched: ${state.totalFetched}`);
        console.log(`⏱️  Total time: ${elapsed.toFixed(1)}s`);
        console.log(`❌ Errors encountered: ${state.errors.length}`);
        console.log(`📁 Data saved to: ${CONFIG.OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('💥 Fatal error during fetch:', error.message);
        
        // Save checkpoint before exiting
        await saveCheckpoint();
        
        console.log('💾 Progress saved. You can resume by running the script again.');
        process.exit(1);
    }
}

/**
 * Validate configuration before starting
 */
function validateConfig() {
    console.log('🔍 Validating configuration...');
    console.log('API Keys from env:', {
        key1: process.env.NASA_API_KEY1 ? 'Found' : 'Missing',
        key2: process.env.NASA_API_KEY2 ? 'Found' : 'Missing',
        key3: process.env.NASA_API_KEY3 ? 'Found' : 'Missing',
        key4: process.env.NASA_API_KEY4 ? 'Found' : 'Missing',
        key5: process.env.NASA_API_KEY5 ? 'Found' : 'Missing',
    });
    
    if (CONFIG.API_KEYS.length === 0) {
        console.error('❌ No API keys found in environment variables');
        console.error('   Make sure NASA_API_KEY1, NASA_API_KEY2, etc. are set in your .env file');
        console.error('   Current working directory:', process.cwd());
        console.error('   Looking for .env file at:', path.join(__dirname, '../.env'));
        process.exit(1);
    }
    
    console.log(`✅ Configuration valid`);
    console.log(`🔑 Found ${CONFIG.API_KEYS.length} API keys`);
    console.log(`📁 Output file: ${CONFIG.OUTPUT_FILE}`);
}

// Run the script
console.log('🚀 NEO Data Fetcher starting...');
validateConfig();
fetchAllNeoData().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});

export { fetchAllNeoData };