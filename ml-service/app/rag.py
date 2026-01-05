import uuid
from typing import Dict, List

import chromadb
from sentence_transformers import SentenceTransformer
from datetime import datetime


class RAGEngine:
    def __init__(self, persist_directory: str = "./rag_storage"):
        print("Initializing RAG Engine...")
        self.persist_directory = persist_directory

        # Initialize Vector DB (ChromaDB)
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)

        # Create or get collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="aigestion_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )

        # Initialize Embedding Model (Optimized for CPU/Latency)
        # 'all-MiniLM-L6-v2' is fast and good for general purpose
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("RAG Engine Initialized.")

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Simple splitting strategy."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
        return chunks

    def archive(self, text: str, metadata: Dict = None) -> int:
        """Ingest text into the vector store with enriched metadata."""
        if metadata is None:
            metadata = {}
        # Add timestamp metadata
        metadata.setdefault("timestamp", datetime.utcnow().isoformat() + "Z")
        chunks = self.chunk_text(text)
        if not chunks:
            return 0

        # Create embeddings (already normalized in previous change)
        import numpy as np
        raw_embeddings = self.model.encode(chunks)
        norms = np.linalg.norm(raw_embeddings, axis=1, keepdims=True)
        embeddings = (raw_embeddings / norms).tolist()

        # Prepare data for Chroma
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [metadata for _ in chunks]

        self.collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        return len(chunks)

    def retrieve(self, query: str, n_results: int = 3, metadata_filter: Dict = None) -> List[Dict]:
        """Search for relevant documents, optionally filtering by metadata."""
        query_embedding = self.model.encode([query]).tolist()

        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        output = []
        if results.get('documents'):
            for i in range(len(results['documents'][0])):
                doc_meta = results['metadatas'][0][i] if results.get('metadatas') else {}
                # Apply metadata filter if provided
                if metadata_filter:
                    if not all(doc_meta.get(k) == v for k, v in metadata_filter.items()):
                        continue
                output.append({
                    "content": results['documents'][0][i],
                    "metadata": doc_meta,
                    "distance": results['distances'][0][i] if 'distances' in results else None
                })
        return output

    def wipe_memory(self):
        """Clear the database."""
        self.chroma_client.delete_collection("aigestion_knowledge_base")
        self.collection = self.chroma_client.get_or_create_collection(
            name="aigestion_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )

    def prune_collection(self, max_entries: int = 10000):
        """Prune the collection to keep at most max_entries items.
        Simple strategy: if count exceeds max, delete oldest entries based on insertion order.
        """
        try:
            count = self.collection.count()
            if count > max_entries:
                # Retrieve IDs (assuming they were added in order)
                ids = self.collection.get()['ids']
                # Determine IDs to remove
                to_remove = ids[: count - max_entries]
                if to_remove:
                    self.collection.delete(ids=to_remove)
        except Exception as e:
            print(f"Pruning failed: {e}")
