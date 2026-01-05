/**
 * NEXUS V1 - Generador de Tokens Seguros
 * Ejecutar: node generate-tokens.js
 */

const crypto = require('crypto');

console.log('\n🔐 NEXUS V1 - Generador de Tokens Seguros\n');
console.log('='.repeat(50));

// JWT Secret (256 bits = 64 hex chars)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n✅ JWT_SECRET:');
console.log(`   ${jwtSecret}`);

// Redis Password (32 chars alfanumérico)
const redisPassword = crypto
  .randomBytes(24)
  .toString('base64')
  .replace(/[^a-zA-Z0-9]/g, '')
  .slice(0, 32);
console.log('\n✅ REDIS_PASSWORD:');
console.log(`   ${redisPassword}`);

// RabbitMQ Password (24 chars alfanumérico)
const rabbitPassword = crypto
  .randomBytes(18)
  .toString('base64')
  .replace(/[^a-zA-Z0-9]/g, '')
  .slice(0, 24);
console.log('\n✅ RABBITMQ_DEFAULT_PASS:');
console.log(`   ${rabbitPassword}`);

console.log('\n' + '='.repeat(50));
console.log('\n📋 Copia estos valores a tu archivo .env:\n');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`REDIS_PASSWORD="${redisPassword}"`);
console.log(`RABBITMQ_DEFAULT_PASS="${rabbitPassword}"`);
console.log(`RABBITMQ_URI="amqp://admin:${rabbitPassword}@localhost:5672"`);
console.log('\n⚠️  Guarda estos valores de forma segura. No los compartas.\n');

