const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function run() {
  try {
    console.log('Importing @google/generative-ai...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ No GEMINI_API_KEY or GOOGLE_GENAI_API_KEY found');
      console.log(
        'Environment keys:',
        Object.keys(process.env).filter((k) => k.includes('API_KEY'))
      );
      process.exit(1);
    }

    console.log(`✅ API Key present (${apiKey.length} chars)`);
    console.log(`Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

    if (apiKey.includes('YOUR_') || apiKey.includes('PLACEHOLDER')) {
      console.error('❌ Key appears to be a placeholder!');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('Sending request to Gemini...');
    const result = await model.generateContent('Say "Nexus Online"');
    console.log('Response:', result.response.text());
    console.log('✨ SUCCESS: Gemini is working');
  } catch (e) {
    console.error('❌ FAILED:', e);
    process.exit(1);
  }
}

run();
