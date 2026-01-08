import os
import math
import re
from pathlib import Path


class RagSimulator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir).resolve()
        self.ignored_dirs = {
            "node_modules",
            "dist",
            "build",
            ".git",
            ".turbo",
            "coverage",
            "logs",
            ".trunk",
            ".vscode",
            ".idea",
        }
        self.ignored_exts = {
            ".lock",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".svg",
            ".ico",
            ".pdf",
            ".zip",
            ".map",
            ".mp4",
            ".mp3",
        }

    def scan(self):
        files = []
        for root, dirs, filenames in os.walk(self.root_dir):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs]

            for filename in filenames:
                ext = os.path.splitext(filename)[1].lower()
                if ext in self.ignored_exts:
                    continue

                full_path = Path(root) / filename
                try:
                    content = full_path.read_text(encoding="utf-8")
                    files.append(
                        {
                            "path": str(full_path.relative_to(self.root_dir)),
                            "content": content,
                        }
                    )
                except:
                    continue
        return files

    def rank_files(self, files, query: str):
        terms = [t.lower() for t in query.split() if len(t) > 2]
        if not terms:
            return files

        results = []
        for file in files:
            keyword_score = 0
            semantic_score = 0
            content_lower = file["content"].lower()
            path_lower = file["path"].lower()

            for term in terms:
                if term in path_lower:
                    semantic_score += 10

                # Frequency count
                matches = re.findall(re.escape(term), content_lower)
                keyword_score += len(matches)

            final_keyword_score = math.log1p(keyword_score) if keyword_score > 0 else 0
            total_score = semantic_score * 2 + final_keyword_score

            results.append({"file": file, "score": total_score})

        # Sort by score DESC
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    def get_context(self, query: str, max_size: int = 50000):
        all_files = self.scan()
        ranked = self.rank_files(all_files, query)

        context = f'[Context optimized for query: "{query}"]\n\n'
        current_size = len(context)
        included_contexts = []

        for item in ranked:
            file = item["file"]
            if item["score"] == 0:
                continue

            block = f"<file path=\"{file['path']}\">\n{file['content']}\n</file>\n\n"
            if current_size + len(block) > max_size:
                break

            context += block
            included_contexts.append(file["content"])
            current_size += len(block)

        return context, included_contexts
