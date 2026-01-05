console.log('🔵 [DEBUG] env-setup.ts: Starting...');
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
console.log('🟢 [DEBUG] env-setup.ts: Finished');
