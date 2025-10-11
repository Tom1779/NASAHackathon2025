#!/usr/bin/env node

/**
 * NEO Data Fetcher - Collects all asteroid data from NASA NEO API
 * FIXED: Uses streaming to avoid memory/string length issues
 */

import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

// Configuration
const CONFIG = {
  BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
  API_KEYS: [
    process.env.NASA_API_KEY1,
    process.env.NASA_API_KEY2,
    process.env.NASA_API_KEY3,
    process.env.NASA_API_KEY4,
    process.env.NASA_API_KEY5,
  ].filter(Boolean),
  OUTPUT_FILE: path.join(__dirname, '../src/data/all_neo_data.json'),
  CHECKPOINT_FILE: path.join(__dirname, '../src/data/neo_fetch_checkpoint.json'),
  ITEMS_PER_PAGE: 20,
  DELAY_BETWEEN_REQUESTS: 500,
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2,
}

// State management
let state = {
  currentKeyIndex: 0,
  totalFetched: 0,
  currentPage: 0,
  isComplete: false,
  errors: [],
  startTime: Date.now(),
}

// Stream writer for NEO data
let neoDataStream = null

function getCurrentApiKey() {
  return CONFIG.API_KEYS[state.currentKeyIndex]
}

function rotateApiKey() {
  state.currentKeyIndex = (state.currentKeyIndex + 1) % CONFIG.API_KEYS.length
  console.log(`🔄 Rotated to API key #${state.currentKeyIndex + 1}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getBackoffDelay(attempt) {
  return CONFIG.DELAY_BETWEEN_REQUESTS * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt)
}

async function saveCheckpoint() {
  const checkpoint = {
    ...state,
    timestamp: Date.now(),
  }

  try {
    await fs.writeFile(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
    console.log(`💾 Checkpoint saved: Page ${state.currentPage}, Total: ${state.totalFetched}`)
  } catch (error) {
    console.error('❌ Failed to save checkpoint:', error.message)
  }
}

async function loadCheckpoint() {
  try {
    const data = await fs.readFile(CONFIG.CHECKPOINT_FILE, 'utf8')
    const checkpoint = JSON.parse(data)

    state.currentPage = checkpoint.currentPage || 0
    state.totalFetched = checkpoint.totalFetched || 0
    state.currentKeyIndex = checkpoint.currentKeyIndex || 0
    state.errors = checkpoint.errors || []

    console.log(
      `📂 Resumed from checkpoint: Page ${state.currentPage}, Total: ${state.totalFetched}`,
    )
    return true
  } catch (error) {
    console.log('📂 No checkpoint found, starting fresh')
    return false
  }
}

/**
 * Initialize streaming JSON writer
 */
async function initStreamWriter() {
  const dataDir = path.dirname(CONFIG.OUTPUT_FILE)
  await fs.mkdir(dataDir, { recursive: true })

  // Check if we're resuming and need to rebuild the file
  const isResuming = state.currentPage > 0

  if (isResuming) {
    console.log('⚠️  Resuming detected - will rebuild file from scratch')
    console.log('   (Previous partial data will be overwritten)')
  }

  // Always start fresh to avoid corruption
  neoDataStream = createWriteStream(CONFIG.OUTPUT_FILE, { flags: 'w' })

  // Write opening JSON structure
  const metadata = {
    total_count: state.totalFetched,
    fetch_date: new Date().toISOString(),
    fetch_start_time: new Date(state.startTime).toISOString(),
    api_keys_used: CONFIG.API_KEYS.length,
    errors_count: state.errors.length,
    is_complete: false,
    resuming_from_page: isResuming ? state.currentPage : 0,
  }

  neoDataStream.write('{\n')
  neoDataStream.write(`  "metadata": ${JSON.stringify(metadata, null, 2).split('\n').join('\n  ')},\n`)
  neoDataStream.write(`  "errors": ${JSON.stringify(state.errors, null, 2).split('\n').join('\n  ')},\n`)
  neoDataStream.write('  "near_earth_objects": [\n')

  console.log('📝 Initialized streaming JSON writer')
}

/**
 * Append NEO data to stream
 */
function appendNeosToStream(neos, isFirst) {
  for (let i = 0; i < neos.length; i++) {
    const neo = neos[i]
    const neoJson = JSON.stringify(neo, null, 2)
    const indentedNeo = neoJson.split('\n').map(line => '    ' + line).join('\n')
    
    if (!isFirst || i > 0) {
      neoDataStream.write(',\n')
    }
    neoDataStream.write(indentedNeo)
  }
}

/**
 * Finalize and close stream
 */
async function finalizeStream() {
  return new Promise((resolve, reject) => {
    // Write closing JSON structure
    neoDataStream.write('\n  ]\n')
    neoDataStream.write('}')
    
    neoDataStream.end(() => {
      console.log('✅ JSON file finalized')
      resolve()
    })
    
    neoDataStream.on('error', reject)
  })
}

/**
 * Update metadata in completed file (optional, for final stats)
 */
async function updateFinalMetadata() {
  try {
    // Read the file
    const content = await fs.readFile(CONFIG.OUTPUT_FILE, 'utf8')
    
    // Update metadata section with regex
    const finalMetadata = {
      total_count: state.totalFetched,
      fetch_date: new Date().toISOString(),
      fetch_duration_ms: Date.now() - state.startTime,
      api_keys_used: CONFIG.API_KEYS.length,
      errors_count: state.errors.length,
      is_complete: true,
    }
    
    const metadataStr = JSON.stringify(finalMetadata, null, 2).split('\n').join('\n  ')
    const updatedContent = content.replace(
      /"metadata":\s*{[^}]+}/,
      `"metadata": ${metadataStr}`
    )
    
    await fs.writeFile(CONFIG.OUTPUT_FILE, updatedContent)
    console.log('✅ Updated final metadata')
  } catch (error) {
    console.error('⚠️  Could not update final metadata:', error.message)
  }
}

async function makeApiRequest(url, params, attempt = 0) {
  const apiKey = getCurrentApiKey()

  try {
    console.log(
      `📡 Requesting page ${state.currentPage} (Key #${state.currentKeyIndex + 1}, Attempt ${attempt + 1})`,
    )

    const response = await axios.get(url, {
      params: { ...params, api_key: apiKey },
      timeout: 30000,
    })

    return response.data
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.error_message || error.message

    console.error(`❌ Request failed (Status: ${status}): ${message}`)

    if (status === 429 || status === 403) {
      console.log('⚠️  Rate limit hit, rotating API key...')
      rotateApiKey()

      if (state.currentKeyIndex === 0) {
        const waitTime = getBackoffDelay(attempt) * CONFIG.API_KEYS.length
        console.log(`⏱️  Waiting ${waitTime}ms before retrying...`)
        await sleep(waitTime)
      }
    }

    if (attempt < CONFIG.MAX_RETRIES) {
      const delay = getBackoffDelay(attempt)
      console.log(`🔄 Retrying in ${delay}ms...`)
      await sleep(delay)
      return makeApiRequest(url, params, attempt + 1)
    }

    state.errors.push({
      page: state.currentPage,
      error: message,
      timestamp: Date.now(),
    })

    throw new Error(`Max retries exceeded for page ${state.currentPage}: ${message}`)
  }
}

async function fetchNeoPage(page) {
  const url = `${CONFIG.BASE_URL}/neo/browse`
  const params = { page }

  const data = await makeApiRequest(url, params)

  if (!data || !data.near_earth_objects) {
    throw new Error(`Invalid response format for page ${page}`)
  }

  return data
}

function processNeoData(neos) {
  return neos.map((neo) => ({
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
    fetched_at: new Date().toISOString(),
  }))
}

function displayProgress(pageData) {
  const elapsed = (Date.now() - state.startTime) / 1000
  const rate = state.totalFetched / elapsed

  console.log(`📊 Progress: ${state.totalFetched} NEOs fetched`)
  console.log(`⏱️  Time elapsed: ${elapsed.toFixed(1)}s`)
  console.log(`🚀 Rate: ${rate.toFixed(1)} NEOs/sec`)

  if (pageData?.page) {
    const total = pageData.page.total_elements
    const pages = pageData.page.total_pages
    if (total && pages) {
      const progress = (((state.currentPage + 1) / pages) * 100).toFixed(1)
      console.log(`📄 Page ${state.currentPage + 1}/${pages} (${progress}%)`)
      console.log(`🎯 Total estimated: ${total} NEOs`)
    }
  }

  console.log('─'.repeat(50))
}

async function fetchAllNeoData() {
  console.log('🚀 Starting NEO data fetch...')
  console.log(`🔑 Using ${CONFIG.API_KEYS.length} API keys`)

  await loadCheckpoint()
  state.startTime = Date.now()

  // Initialize streaming writer
  await initStreamWriter()

  try {
    let isFirstNeo = true

    while (!state.isComplete) {
      if (state.currentPage > 0) {
        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS)
      }

      try {
        const pageData = await fetchNeoPage(state.currentPage)
        const neos = pageData.near_earth_objects || []

        if (neos.length === 0) {
          console.log('✅ No more data available, fetch complete')
          state.isComplete = true
          break
        }

        const processedNeos = processNeoData(neos)
        
        // Append to stream instead of memory
        appendNeosToStream(processedNeos, isFirstNeo)
        isFirstNeo = false

        state.totalFetched += processedNeos.length
        state.currentPage++

        displayProgress(pageData)

        // Save checkpoint every 10 pages
        if (state.currentPage % 10 === 0) {
          await saveCheckpoint()
          console.log('✅ Checkpoint saved (data streaming to disk)')
        }

        if (pageData.page) {
          const { number: currentPageNum, total_pages: totalPages } = pageData.page
          if (currentPageNum >= totalPages - 1) {
            console.log('✅ Reached last page, fetch complete')
            state.isComplete = true
          }
        }
      } catch (error) {
        console.error(`❌ Failed to fetch page ${state.currentPage}:`, error.message)

        if (error.message.includes('Max retries exceeded')) {
          console.log('⏭️  Skipping failed page and continuing...')
          state.currentPage++
        } else {
          throw error
        }
      }
    }

    // Finalize the JSON file
    state.isComplete = true
    await finalizeStream()
    await updateFinalMetadata()

    // Clean up checkpoint
    try {
      await fs.unlink(CONFIG.CHECKPOINT_FILE)
      console.log('🧹 Cleaned up checkpoint file')
    } catch (error) {
      // Ignore
    }

    const elapsed = (Date.now() - state.startTime) / 1000
    console.log('\n🎉 Fetch completed successfully!')
    console.log(`📊 Total NEOs fetched: ${state.totalFetched}`)
    console.log(`⏱️  Total time: ${elapsed.toFixed(1)}s`)
    console.log(`❌ Errors encountered: ${state.errors.length}`)
    console.log(`📁 Data saved to: ${CONFIG.OUTPUT_FILE}`)
  } catch (error) {
    console.error('💥 Fatal error during fetch:', error.message)
    
    // Close stream if open
    if (neoDataStream) {
      neoDataStream.end()
    }

    await saveCheckpoint()
    console.log('💾 Progress saved. You can resume by running the script again.')
    process.exit(1)
  }
}

function validateConfig() {
  console.log('🔍 Validating configuration...')

  if (CONFIG.API_KEYS.length === 0) {
    console.error('❌ No API keys found in environment variables')
    console.error('   Make sure NASA_API_KEY1, NASA_API_KEY2, etc. are set in your .env file')
    process.exit(1)
  }

  console.log(`✅ Configuration valid`)
  console.log(`🔑 Found ${CONFIG.API_KEYS.length} API keys`)
  console.log(`📁 Output file: ${CONFIG.OUTPUT_FILE}`)
}

console.log('🚀 NEO Data Fetcher starting...')
validateConfig()
fetchAllNeoData().catch((error) => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})

export { fetchAllNeoData }