# NEO Data Fetcher

This script fetches all Near Earth Object (NEO) data from NASA's NEO API and stores it locally in a single JSON file.

## Features

- **Multi-API Key Support**: Uses 5 NASA API keys with automatic rotation to avoid rate limits
- **Rate Limit Protection**: Implements exponential backoff and intelligent retry logic
- **Resume Capability**: Saves progress checkpoints to resume if interrupted
- **Comprehensive Data**: Fetches all ~40,000 asteroids from the NASA NEO Browse API
- **Progress Tracking**: Real-time progress display with statistics

## Setup

1. Ensure your `.env` file has the 5 NASA API keys:
   ```env
   NASA_API_KEY1=your_first_key
   NASA_API_KEY2=your_second_key
   NASA_API_KEY3=your_third_key
   NASA_API_KEY4=your_fourth_key
   NASA_API_KEY5=your_fifth_key
   ```

2. Install dependencies (if not already done):
   ```bash
   pnpm install
   ```

## Running the Fetcher

### Using the npm script (recommended):
```bash
pnpm run fetch-neo-data
```

### Or run directly:
```bash
node scripts/fetchAllNeoData.js
```

## Output

The script will create two files:

1. **`src/data/all_neo_data.json`** - The final dataset containing all NEO data
2. **`src/data/neo_fetch_checkpoint.json`** - Progress checkpoint (automatically cleaned up on completion)

### Output Structure

```json
{
  "metadata": {
    "total_count": 40000,
    "fetch_date": "2025-10-06T22:30:00.000Z",
    "fetch_duration_ms": 180000,
    "api_keys_used": 5,
    "errors_count": 2
  },
  "errors": [
    // Any errors that occurred during fetching
  ],
  "near_earth_objects": [
    {
      "id": "2000433",
      "neo_reference_id": "2000433",
      "name": "433 Eros (A898 PA)",
      "nasa_jpl_url": "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2000433",
      "absolute_magnitude_h": 10.4,
      "estimated_diameter": {
        "kilometers": {
          "estimated_diameter_min": 7.3,
          "estimated_diameter_max": 16.3
        }
      },
      "is_potentially_hazardous_asteroid": false,
      "close_approach_data": [...],
      "is_sentry_object": false,
      "links": {...},
      "fetched_at": "2025-10-06T22:30:15.123Z"
    }
    // ... ~40,000 more objects
  ]
}
```

## Resume Functionality

If the script is interrupted (network issues, rate limits, etc.), it will save a checkpoint and you can resume by running it again. The script will automatically detect the checkpoint and continue from where it left off.

## Rate Limiting Strategy

- Uses 5 API keys in rotation
- Base delay of 500ms between requests
- Exponential backoff on failures (500ms, 1s, 2s, 4s...)
- Automatic key rotation on 429/403 responses
- Checkpoint saves every 10 pages to minimize data loss

## Monitoring Progress

The script provides real-time feedback:

```
🚀 Starting NEO data fetch...
🔑 Using 5 API keys
📡 Requesting page 0 (Key #1, Attempt 1)
📊 Progress: 20 NEOs fetched
⏱️  Time elapsed: 2.1s  
🚀 Rate: 9.5 NEOs/sec
📄 Page 1/2000 (0.1%)
🎯 Total estimated: 40000 NEOs
──────────────────────────────────────────────────
💾 Checkpoint saved: Page 10, Total: 200
```

## Expected Runtime

With 5 API keys and ~40,000 objects:
- **Estimated time**: 30-60 minutes (depending on rate limits)
- **Network requests**: ~2,000 pages (20 objects per page)
- **Rate**: ~10-20 objects per second

## Integration with Frontend

Once fetched, you can use the data in your Vue components:

```typescript
import neoData from '@/data/all_neo_data.json';

// Access all NEOs
const allNeos = neoData.near_earth_objects;

// Filter potentially hazardous asteroids
const hazardousNeos = allNeos.filter(neo => neo.is_potentially_hazardous_asteroid);

// Search by name
const searchResults = allNeos.filter(neo => 
  neo.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## Troubleshooting

### Script fails immediately
- Check that your API keys are valid in the `.env` file
- Ensure you have internet connectivity
- Verify the NASA API is operational

### Rate limiting errors persist
- The script automatically handles rate limiting with key rotation
- If all 5 keys are rate limited, it will wait and retry
- Consider increasing `DELAY_BETWEEN_REQUESTS` in the script

### Out of memory errors
- The script loads all data into memory before saving
- On systems with limited RAM, consider modifying the script to write in chunks

### Resuming from checkpoint
- Simply run the script again - it will automatically detect and resume
- Delete `src/data/neo_fetch_checkpoint.json` to start fresh

## File Locations

- **Script**: `scripts/fetchAllNeoData.js`
- **Output**: `src/data/all_neo_data.json`  
- **Checkpoint**: `src/data/neo_fetch_checkpoint.json`
- **Environment**: `.env`