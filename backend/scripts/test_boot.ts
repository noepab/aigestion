import 'reflect-metadata';

import { container } from '../src/config/inversify.config';
import { AIService } from '../src/services/ai.service';
import { TYPES } from '../src/types';

/*
 * Test Boot Script
 * Tries to resolve AIService from container to verify DI wiring.
 */
async function test() {
  console.log('Resolving AIService...');
  try {
    const ai = container.get<AIService>(TYPES.AIService);
    console.log('✅ AIService Resolved!');

    // Optional: Test valid key
    console.log('Testing generateContent...');
    const response = await ai.generateContent('Hello Nexus');
    console.log('Response:', response);

  } catch (err) {
    console.error('❌ Resolution Failed:', err);
    process.exit(1);
  }
}

test();
