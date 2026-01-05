import json
import logging
import os
from typing import Any, Dict, List

import google.generativeai as genai
import numpy as np

logger = logging.getLogger("MemoryService")


class MemoryService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.memory_file = (
            "C:\\Users\\Alejandro\\AIG\\AIG-ia-engine\\swarm\\long_term_memory.json"
        )
        self.documents = []
        self._load_memory()

        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = "models/embedding-001"  # Standard Gemini embedding model
        else:
            self.model = None

    def _load_memory(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, "r") as f:
                    self.documents = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load memory: {e}")

    def _save_memory(self):
        try:
            with open(self.memory_file, "w") as f:
                json.dump(self.documents, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save memory: {e}")

    def _get_embedding(self, text: str) -> List[float]:
        if not self.model:
            return []
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document",
                title="Swarm Memory",
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return []

    def remember(self, text: str, metadata: Dict[str, Any] = {}):
        """Store a thought/fact/ruling in memory."""
        embedding = self._get_embedding(text)
        if embedding:
            doc = {
                "text": text,
                "metadata": metadata,
                "embedding": embedding,
                "timestamp": metadata.get("timestamp", "unknown"),
            }
            self.documents.append(doc)
            self._save_memory()
            logger.info(f"Stored in memory: {text[:50]}...")

    def recall(self, query: str, limit: int = 3) -> List[Dict]:
        """Retrieve relevant context for a query."""
        if not self.documents:
            return []

        query_embedding = self._get_embedding(query)
        if not query_embedding:
            return []

        # Calculate Cosine Similarity
        scored_docs = []
        q_vec = np.array(query_embedding)

        for doc in self.documents:
            d_vec = np.array(doc["embedding"])
            similarity = np.dot(q_vec, d_vec) / (
                np.linalg.norm(q_vec) * np.linalg.norm(d_vec)
            )
            scored_docs.append((similarity, doc))

        # Sort by score desc
        scored_docs.sort(key=lambda x: x[0], reverse=True)

        return [d[1] for d in scored_docs[:limit]]

    def ingest_docs(self, dir_path: str):
        """Ingest markdown files from a directory."""
        if not os.path.exists(dir_path):
            return 0

        count = 0
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith(".md"):
                    path = os.path.join(root, file)
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        self.remember(
                            content, {"source": path, "type": "documentation"}
                        )
                        count += 1
        return count
