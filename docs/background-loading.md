# Background Loading Implementation

## Overview

Implemented automatic background loading of all NEO asteroid data from GitHub-hosted chunked JSON files with intelligent caching and search behavior.

## Key Features

### 1. Chunked Data Loading

- **GitHub Chunks**: Data is split into multiple JSON chunks hosted on GitHub (e.g., `neo_chunk_000.json` to `neo_chunk_XXX.json`)
- **Sequential Fetching**: Loads chunks one by one with delays to avoid rate limits
- **Local Caching**: Uses in-memory cache for 24 hours to avoid re-fetching

### 2. Automatic Background Loading

- **Initial Load**: App loads all asteroid data from chunks on first access
- **Background Processing**: Parses and processes chunked data in background
- **Non-Blocking**: User can interact with the app while data loads
- **Progress Tracking**: Shows loading status ("Loading all asteroids...")

### 3. Search Behavior

- **Data Completion Wait**: If user searches before all data is loaded, the app automatically waits for complete data load
- **User Feedback**: Shows "Waiting for all data before searching..." message
- **Seamless Experience**: Once loaded, searches are instant on all data

### 4. Loading States

- **isLoadingAll**: Indicates background loading is in progress
- **allDataLoaded**: Indicates all asteroids have been loaded from chunks
- **Visual Indicators**:
  - Loading message while fetching chunks
  - Completion status
  - Total count of loaded asteroids

## Implementation Details

### Modified Files

#### 1. `composables/useAsteroids.ts`

Added functions:

- `loadAllAsteroidsFromJson()`: Fetches and processes chunked JSON data
- Memory cache with 24-hour expiration
- Error handling for fetch failures

#### 2. `App.vue`

- Calls `loadAllAsteroidsFromJson()` on mount
- Passes loading states to components

#### 3. `components/AsteroidSelector.vue`

- Shows loading indicators
- Props updated to accept `isLoadingAll` and `allDataLoaded`

## Usage Flow

1. **App Starts**:
   - Checks memory cache first
   - If not cached, fetches JSON chunks from GitHub
   - Processes data in background

2. **User Browses**:
   - Can select asteroids once loaded
   - Sees loading indicator during fetch

3. **User Searches**:
   - If data still loading: waits for completion
   - If data loaded: instant search across all asteroids

4. **Background Complete**:
   - All asteroids loaded from chunks
   - Data cached for future sessions

## Rate Limiting & Error Handling

- Delays between chunk requests to avoid GitHub rate limits
- Graceful error handling for network failures
- Fallback to cached data if available

## Benefits

- **Scalable Data**: Handles large datasets via chunking
- **Fast Subsequent Loads**: Memory cache avoids re-fetching
- **Good UX**: Background loading with clear feedback
- **Reliable**: Handles network issues gracefully
