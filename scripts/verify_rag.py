import sys
from pathlib import Path

# Add ml-service to path
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
ml_service_path = root_dir / 'ml-service' / 'app'
sys.path.append(str(ml_service_path))

from rag import RAGEngine

# Use the real database path
db_path = root_dir / 'data' / 'chromadb'

print(f"Connecting to RAG Engine at {db_path}...")
try:
    engine = RAGEngine(persist_directory=str(db_path))

    # Simple query
    query = "Nexus architecture"
    print(f"Querying: '{query}'")
    results = engine.retrieve(query, n_results=3)

    print(f"\nFound {len(results)} results:")
    for i, res in enumerate(results):
        print(f"\n--- Result {i+1} ---")
        print(f"File: {res['metadata'].get('filename', 'Unknown')}")
        print(f"Source: {res['metadata'].get('source', 'Unknown')}")
        print(f"Excerpt: {res['content'][:200]}...")

except Exception as e:
    print(f"Error: {e}")
