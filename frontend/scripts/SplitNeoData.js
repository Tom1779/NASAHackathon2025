#!/usr/bin/env node

/**
 * SIMPLER APPROACH: Just parse the whole file section by section
 * Since we can't read it all at once, we'll read it in parts and accumulate asteroids
 */

import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONFIG = {
  INPUT_FILE: path.join(__dirname, '../src/data/all_neo_data.json'),
  OUTPUT_DIR: path.join(__dirname, '../src/data/chunks'),
  ASTEROIDS_PER_CHUNK: 2000,
}

async function splitExistingData() {
  console.log('📂 Reading file structure...')
  
  await fsPromises.mkdir(CONFIG.OUTPUT_DIR, { recursive: true })
  
  // Try a different approach: use Node's streaming JSON parser
  // Read file and manually extract objects with regex
  
  const fileHandle = await fsPromises.open(CONFIG.INPUT_FILE, 'r')
  const stats = await fileHandle.stat()
  const fileSize = stats.size
  
  console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
  
  // Read in larger chunks
  const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB chunks
  let position = 0
  let accumulatedText = ''
  let foundArrayStart = false
  let asteroidCount = 0
  let chunkNum = 0
  let currentChunkAsteroids = []
  
  const saveChunk = async () => {
    if (currentChunkAsteroids.length === 0) return
    
    const chunkData = {
      chunk_index: chunkNum,
      asteroids_in_chunk: currentChunkAsteroids.length,
      asteroids: currentChunkAsteroids
    }
    
    const filename = `neo_chunk_${String(chunkNum).padStart(3, '0')}.json`
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename)
    
    await fsPromises.writeFile(filepath, JSON.stringify(chunkData, null, 2))
    console.log(`✓ Saved ${filename} with ${currentChunkAsteroids.length} asteroids`)
    
    currentChunkAsteroids = []
    chunkNum++
  }
  
  console.log('\nProcessing file in chunks...')
  
  while (position < fileSize) {
    const buffer = Buffer.alloc(Math.min(CHUNK_SIZE, fileSize - position))
    const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, position)
    
    if (bytesRead === 0) break
    
    const text = buffer.toString('utf8', 0, bytesRead)
    accumulatedText += text
    position += bytesRead
    
    console.log(`Read ${(position / 1024 / 1024).toFixed(1)} MB / ${(fileSize / 1024 / 1024).toFixed(1)} MB`)
    
    // Find the array start if we haven't yet
    if (!foundArrayStart) {
      const arrayStartIdx = accumulatedText.indexOf('"near_earth_objects": [')
      if (arrayStartIdx !== -1) {
        foundArrayStart = true
        accumulatedText = accumulatedText.substring(arrayStartIdx + '"near_earth_objects": ['.length)
        console.log('✓ Found array start, beginning parse...')
      } else {
        // Keep last part in case pattern spans chunks
        accumulatedText = accumulatedText.slice(-500)
        continue
      }
    }
    
    // Parse complete objects from accumulated text
    let depth = 0
    let objStart = -1
    let inString = false
    let escape = false
    
    for (let i = 0; i < accumulatedText.length; i++) {
      const char = accumulatedText[i]
      
      if (escape) {
        escape = false
        continue
      }
      
      if (char === '\\') {
        escape = true
        continue
      }
      
      if (char === '"' && !escape) {
        inString = !inString
      }
      
      if (inString) continue
      
      if (char === '{') {
        if (depth === 0) objStart = i
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0 && objStart !== -1) {
          // Complete object found
          const objStr = accumulatedText.substring(objStart, i + 1)
          
          try {
            const asteroid = JSON.parse(objStr)
            currentChunkAsteroids.push(asteroid)
            asteroidCount++
            
            if (asteroidCount % 500 === 0) {
              console.log(`  Parsed ${asteroidCount} asteroids...`)
            }
            
            if (currentChunkAsteroids.length >= CONFIG.ASTEROIDS_PER_CHUNK) {
              await saveChunk()
            }
            
            // Remove processed text
            accumulatedText = accumulatedText.substring(i + 1)
            i = 0
            objStart = -1
          } catch (e) {
            console.log(`Parse error at asteroid ${asteroidCount}: ${e.message}`)
          }
        }
      } else if (char === ']' && depth === 0) {
        console.log('✓ Reached end of array')
        break
      }
    }
    
    // If we're in an object, keep the text for next iteration
    if (depth > 0 && objStart !== -1) {
      accumulatedText = accumulatedText.substring(objStart)
    } else {
      // Keep some overlap
      accumulatedText = accumulatedText.slice(-10000)
    }
  }
  
  await fileHandle.close()
  
  // Save final chunk
  if (currentChunkAsteroids.length > 0) {
    await saveChunk()
  }
  
  // Create manifest
  const manifest = {
    total_asteroids: asteroidCount,
    total_chunks: chunkNum,
    asteroids_per_chunk: CONFIG.ASTEROIDS_PER_CHUNK,
    created_at: new Date().toISOString(),
  }
  
  await fsPromises.writeFile(
    path.join(CONFIG.OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  
  console.log(`\n🎉 Complete!`)
  console.log(`📊 Total: ${asteroidCount} asteroids in ${chunkNum} chunks`)
  console.log(`📁 Output: ${CONFIG.OUTPUT_DIR}`)
}

splitExistingData().catch(console.error)