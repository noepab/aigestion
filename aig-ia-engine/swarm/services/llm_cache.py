import hashlib
import json
import logging
import redis
from typing import Optional, Any
from pathlib import Path

# Setup simple logger if not initialized
logger = logging.getLogger("LLMCache")

class LLMCache:
    """
    Redis-based cache for LLM responses to reduce latency and costs.
    """
    def __init__(self, redis_url: str = "redis://localhost:6379/0", ttl: int = 3600):
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            self.ttl = ttl
            self.enabled = True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.enabled = False

    def _generate_key(self, prompt: str, params: Optional[dict] = None) -> str:
        """Generates a unique cache key based on prompt and parameters."""
        data = {"prompt": prompt, "params": params or {}}
        dump = json.dumps(data, sort_keys=True)
        return f"llm_cache:{hashlib.sha256(dump.encode()).hexdigest()}"

    def get(self, prompt: str, params: Optional[dict] = None) -> Optional[str]:
        """Retrieves a cached response."""
        if not self.enabled:
            return None

        key = self._generate_key(prompt, params)
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    def set(self, prompt: str, response: str, params: Optional[dict] = None):
        """Stores a response in the cache."""
        if not self.enabled:
            return

        key = self._generate_key(prompt, params)
        try:
            self.client.setex(key, self.ttl, response)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
