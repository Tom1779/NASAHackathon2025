#!/usr/bin/env node

/**
 * Fresh NEO Data Fetch - Starts from scratch
 * Deletes existing checkpoint and JSON files to start completely fresh
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHECKPOINT_FILE = path.join(__dirname, '../src/data/neo_fetch_checkpoint.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/all_neo_data.json');

async function startFresh() {
    console.log('🗑️  Starting fresh NEO data fetch...');
    
    // Delete checkpoint file
    try {
        await fs.unlink(CHECKPOINT_FILE);
        console.log('✅ Deleted checkpoint file');
    } catch (error) {
        console.log('ℹ️  No checkpoint file to delete');
    }
    
    // Delete existing JSON file
    try {
        await fs.unlink(OUTPUT_FILE);
        console.log('✅ Deleted existing JSON file');
    } catch (error) {
        console.log('ℹ️  No existing JSON file to delete');
    }
    
    console.log('🚀 Ready to start fresh! Run: pnpm run fetch-neo-data');
}

startFresh().catch(console.error);