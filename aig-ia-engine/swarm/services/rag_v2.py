import abc
import json
from typing import List, Dict, Any
from pathlib import Path


class BaseRetriever(abc.ABC):
    @abc.abstractmethod
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        pass


class VectorRetriever(BaseRetriever):
    """Simulates Vector Search (Semantic)."""

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        return [
            {
                "text": f"Semantic result for: {query}",
                "score": 0.9,
                "source": "vector_db",
            }
        ]


class KeywordRetriever(BaseRetriever):
    """Searches local 'lessons_learned' for matches."""

    def __init__(self):
        self.knowledge_path = (
            Path(__file__).resolve().parents[1] / "lessons_learned.json"
        )

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        results = []
        if self.knowledge_path.exists():
            try:
                with open(self.knowledge_path, "r") as f:
                    lessons = json.load(f).get("lessons", [])
                    for lesson in lessons:
                        if any(
                            word.lower() in lesson["learned"].lower()
                            for word in query.split()
                        ):
                            results.append(
                                {
                                    "text": f"Lesson Learned in {lesson['file']}: {lesson['learned']}",
                                    "score": 0.8,
                                    "source": "lessons_learned",
                                }
                            )
            except:
                pass

        if not results:
            results.append(
                {
                    "text": "No specific lessons found for this query.",
                    "score": 0.1,
                    "source": "knowledge_idx",
                }
            )

        return results[:top_k]


class HybridRetriever:
    """
    Combines Vector and Keyword search results.
    """

    def __init__(self):
        self.vector_retriever = VectorRetriever()
        self.keyword_retriever = KeywordRetriever()

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        vector_results = self.vector_retriever.retrieve(query, top_k)
        keyword_results = self.keyword_retriever.retrieve(query, top_k)

        all_results = vector_results + keyword_results

        # Deduplication based on text
        seen = set()
        unique_results = []
        for res in all_results:
            if res["text"] not in seen:
                unique_results.append(res)
                seen.add(res["text"])

        # Sort by score
        unique_results.sort(key=lambda x: x["score"], reverse=True)

        return unique_results[:top_k]
