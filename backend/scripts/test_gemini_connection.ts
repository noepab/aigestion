import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Manual Load .env from backend root
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ No GEMINI_API_KEY or GOOGLE_GENAI_API_KEY found in environment');
        process.exit(1);
    }

    console.log(`✅ Found API Key (${apiKey.length} chars)`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.0-flash as seen in gemini-analysis.service.ts, fallback to 1.5 if needed
        const modelName = 'gemini-2.0-flash';
        console.log(`Using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log('Testing generation...');
        const result = await model.generateContent('Say "Hello Nexus System" if you can hear me.');
        const response = await result.response;
        const text = response.text();
        console.log(`\n🤖 Response: ${text}`);
        console.log('✨ Gemini Connection Successful!');
    } catch (error: any) {
        console.error('❌ Gemini Connection Failed:', error.message);
        process.exit(1);
    }
}

testGemini();
