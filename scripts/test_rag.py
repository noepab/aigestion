import sys
sys.path.append('ml-service/app')
from rag import RAGEngine

engine = RAGEngine(persist_directory='./tmp_rag')
engine.wipe_memory()
engine.archive('Test document for RAG.', metadata={'type': 'test'})
results = engine.retrieve('RAG test', n_results=1, metadata_filter={'type': 'test'})
print('Results:', results)
