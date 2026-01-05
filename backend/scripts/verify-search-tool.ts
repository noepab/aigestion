
import { SearchWebTool } from '../src/tools/web-search.tool';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function verifySearchTool() {
  console.log('--- Verifying SearchWebTool ---');

  if (!process.env.TAVILY_API_KEY) {
    console.error('❌ TAVILY_API_KEY is missing in environment variables.');
    process.exit(1);
  }

  const tool = new SearchWebTool();
  const query = 'current status of SpaceX Starship';

  console.log(`🔎 Executing search for: "${query}"...`);

  try {
    const result = await tool.execute({ query });
    console.log('✅ Search Successful!');
    console.log('--- Answer ---');
    console.log(result.answer);
    console.log('--- Top Results ---');
    result.results.forEach((r: any, i: number) => {
      console.log(`[${i + 1}] ${r.title} (${r.url})`);
    });
  } catch (error: any) {
    console.error('❌ Search Failed:', error.message);
    process.exit(1);
  }
}

verifySearchTool();
