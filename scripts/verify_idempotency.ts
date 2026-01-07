import { idempotencyMiddleware } from '../backend/src/middleware/idempotency.middleware';
import { cache } from '../backend/src/utils/cacheManager';

async function verifyIdempotency() {
  console.log('--- API Idempotency Verification ---\n');

  const key = 'test-idemp-key-123';
  const userId = 'anonymous';
  const cacheKey = `idempotency:${userId}:${key}`;

  // Clean start
  await cache.delete(cacheKey);

  // Mock Request/Response/Next
  const req: any = {
    method: 'POST',
    path: '/test/route',
    headers: {
      'idempotency-key': key
    }
  };

  let responseData: any = null;
  let statusSet: number = 200;

  const res: any = {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      console.log(`[Header] ${name}: ${value}`);
    },
    status: (s: number) => {
      statusSet = s;
      return res;
    },
    json: (body: any) => {
      responseData = body;
      return res;
    }
  };

  const next = () => {
    console.log('-> Executing Business Logic');
    res.json({ success: true, timestamp: Date.now() });
  };

  // First Attempt
  console.log('1. First attempt (Expecting logic execution)');
  await idempotencyMiddleware(req, res, next);
  const firstTimestamp = responseData.timestamp;
  console.log(`   Result: SUCCESS, Timestamp: ${firstTimestamp}`);

  // Second Attempt (Same Key)
  console.log('\n2. Second attempt with same key (Expecting HIT)');
  let hitHeaderFound = false;
  const res2: any = {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      if (name === 'X-Idempotency-Hit' && value === 'true') hitHeaderFound = true;
      console.log(`[Header] ${name}: ${value}`);
    },
    status: (s: number) => { return res2; },
    json: (body: any) => { responseData = body; return res2; }
  };

  await idempotencyMiddleware(req, res2, () => console.log('ERROR: Logic should not run'));

  if (hitHeaderFound && responseData.timestamp === firstTimestamp) {
    console.log(`   Result: IDEMPOTENCY HIT! Correct timestamp returned: ${responseData.timestamp}`);
    console.log('   ✅ Verification SUCCESS');
  } else {
    console.log('   ❌ Verification FAILED');
  }

  process.exit(0);
}

verifyIdempotency().catch(console.error);
