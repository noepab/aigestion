
import { ragService } from '../backend/src/services/rag.service';

async function verifyIntegration() {
  console.log('Testing RAG Integration...');

  // 1. Test without query (should be just code context)
  console.log('\n--- Test 1: Full Context (No Query) ---');
  // const fullContext = await ragService.getProjectContext();
  // console.log(`Full Context Length: ${fullContext.length}`);
  console.log('Skipping full context for brevity.');

  // 2. Test with query (should trigger RAG)
  const query = "Nexus architecture";
  console.log(`\n--- Test 2: Query "${query}" ---`);
  const queryContext = await ragService.getProjectContext(query);

  // Check for Documentation Memory marker
  if (queryContext.includes('[Documentation Memory]')) {
    console.log('SUCCESS: Documentation Memory found in context!');
    console.log('--------------------------------------------------');

    // Extract doc section
    const docSection = queryContext.split('[Documentation Memory]')[1].split('Here is the codebase context')[0];
    console.log(docSection.trim().substring(0, 500) + '...');
  } else {
    console.log('FAILED: Documentation Memory NOT found.');
    console.log('Make sure ml-service is running on port 8000.');
  }
}

verifyIntegration().catch(console.error);
