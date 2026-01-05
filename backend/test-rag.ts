
// Quick test script for RAG Service
import { ragService } from './src/services/rag.service';

async function testRag() {
    console.log('Testing RAG Service with Caching and Tree View...');

    // First Run
    const start1 = Date.now();
    console.log('--- Run 1 (Cold Start) ---');
    const context1 = await ragService.getProjectContext();
    const dur1 = Date.now() - start1;
    console.log(`Run 1 Duration: ${dur1}ms`);
    console.log(`Context Size: ${context1.length} chars`);

    // Show Tree Preview
    const treeEnd = context1.indexOf('Here is the codebase context');
    console.log('\n--- Tree Preview ---');
    console.log(context1.substring(0, treeEnd < 2000 ? treeEnd : 500));
    console.log('--------------------\n');

    // Second Run (Should be cached)
    const start2 = Date.now();
    console.log('--- Run 2 (Cached) ---');
    const context2 = await ragService.getProjectContext();
    const dur2 = Date.now() - start2;
    console.log(`Run 2 Duration: ${dur2}ms`);
    console.log(`Run 2 Context Size: ${context2.length} chars`);

    if (dur2 > 50 && dur2 > dur1 / 10) {
        console.warn('WARN: Cache speedup not significant. Check implementation.');
    } else {
        console.log('SUCCESS: Cache is working (Instant response).');
    }
}

testRag();
