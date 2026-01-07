import 'reflect-metadata';

import dotenv from 'dotenv';
import path from 'path';

import { container, TYPES  } from '../src/config/inversify.config';
import { SearchService } from '../src/services/search.service';

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

async function testSearch() {
  try {
    console.log('Resolving SearchService...');
    // Manually instantiate to avoid complex container setup if possible, or use container
    // But container requires all bindings.
    // Let's just instantiate directly since we want to test the key.

    // Check key
    const apiKey = process.env.TAVILY_API_KEY;
    console.log(`TAVILY_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);

    // Since SearchService uses 'env' singleton which loads from process.env, it should work if we loaded dotenv first
    // Note: SearchService imports 'env' from '../config/env.schema'. We need to make sure env schema validation doesn't kill us.

    // Mocking env import? No, just run it.

    console.log('Instantiating SearchService...');
    const searchService = new SearchService();

    console.log('Searching for "Nexus AIGestion"...');
    const results = await searchService.search("Nexus AIGestion", 1);

    console.log('Results:', JSON.stringify(results, null, 2));

    if (results.length > 0) {
        console.log('✅ Search Verify: SUCCESS');
    } else {
        console.log('⚠️ Search Verify: PROBABLY SUCCESS (No results but no error)');
    }
  } catch (error) {
    console.error('❌ Search Verify: FAILED', error);
  }
}

testSearch();
