const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const requiredKeys = [
  'TAVILY_API_KEY',
  'GEMINI_API_KEY', // or GOOGLE_GENAI_API_KEY
  'GOOGLE_GENAI_API_KEY',
  'RUNWAY_API_KEY',
  'STRIPE_SECRET_KEY',
];

console.log('\n🔍 Check Credentials:\n');

let missing = 0;

requiredKeys.forEach((key) => {
  const val = envConfig[key];
  if (val && val.trim().length > 0) {
    if (val.startsWith('YOUR_') || val.includes('PLACEHOLDER')) {
      console.log(`❌ ${key}: FOUND but appears to be a PLACEHOLDER (${val})`);
      missing++;
    } else {
      const masked = val.substring(0, 4) + '...' + val.substring(val.length - 4);
      console.log(`✅ ${key}: FOUND (${val.length} chars)`); // Masking fully for safety in logs, just showing length
    }
  } else {
    console.log(`❌ ${key}: MISSING or EMPTY`);
    missing++;
  }
});

// Also check widely used ones
const otherKeys = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
otherKeys.forEach((key) => {
  const val = envConfig[key];
  if (val && val.trim().length > 0) {
    console.log(`✅ ${key}: FOUND`);
  } else {
    console.log(`❌ ${key}: MISSING`);
    missing++;
  }
});

if (missing > 0) {
  console.log(`\n⚠️ Found ${missing} missing credentials.`);
  process.exit(1);
} else {
  console.log('\n✨ All checked credentials present.');
  process.exit(0);
}
