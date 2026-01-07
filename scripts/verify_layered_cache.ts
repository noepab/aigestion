import { cache } from '../backend/src/utils/cacheManager';
import { logger } from '../backend/src/utils/logger';

async function verifyLayeredCache() {
  console.log('--- Layered Cache Verification ---\n');

  const key = 'verify:layered:key';
  const value = { message: 'Layered Cache Test', timestamp: Date.now() };

  // 1. Initial State (Clean)
  await cache.delete(key);
  console.log('1. Initial check (expecting miss)');
  const val1 = await cache.get(key);
  console.log(`   Result: ${val1 ? 'HIT' : 'MISS'}`);

  // 2. Set Value (Populates L1 and attempts L2)
  console.log('\n2. Setting value (Populates L1 & L2)');
  await cache.set(key, value, { ttl: 60 });

  // 3. Check L1 (Should be hit)
  console.log('\n3. Immediate check (Expecting L1 HIT)');
  const startL1 = Date.now();
  const val2 = await cache.get(key);
  const endL1 = Date.now();
  console.log(`   Result: ${val2 ? 'HIT' : 'MISS'} (${endL1 - startL1}ms)`);

  // 4. Simulate L1 Eviction (requires accessing internal Map or just waiting/new session)
  // For this test, we rely on the log 'L1 Cache Hit' vs 'L2 Cache Hit' in logs.

  console.log('\n4. Verification finished.');
  process.exit(0);
}

verifyLayeredCache().catch(console.error);
