from services.memory import MemoryService


def seed_memory():
    print("Initializing Memory Service...")
    memory = MemoryService()

    # Ingest Brain Artifacts (Plans)
    artifacts_dir = "C:\\Users\\Alejandro\\.gemini\\antigravity\\brain\\4134cdf0-e490-42b3-8de8-164017e3f331"
    print(f"Ingesting artifacts from {artifacts_dir}...")

    count = memory.ingest_docs(artifacts_dir)
    print(f"Successfully ingested {count} documents into Swarm Memory.")

    # Verify Recall
    print("Testing recall...")
    results = memory.recall("What is the plan for Phase 9?")
    for doc in results:
        print(f"- Found relevant doc (score > 0.8): {doc['metadata'].get('source')}")


if __name__ == "__main__":
    seed_memory()
