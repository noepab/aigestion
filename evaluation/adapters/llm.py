"""
LLM-based adapters for code quality evaluation.

Supports OpenAI (GPT-3.5, GPT-4) and Google Gemini APIs.

Usage:
  adapter = OpenAIAdapter(config={"api_key": "sk-...", "model": "gpt-3.5-turbo"})
  adapter = GeminiAdapter(config={"api_key": "AIza...", "model": "gemini-2.0-flash"})

Config format:
  {
    "api_key": "your-api-key",
    "model": "model-name",
    "temperature": 0.3,
    "max_tokens": 100,
    "cache": true
  }
"""
import hashlib
import json
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from .base import ModelAdapter


class LLMAdapter(ModelAdapter, ABC):
    """Base class for LLM-based adapters."""

    def __init__(self, config: Dict[str, Any] = None):
        """Initialize LLM adapter."""
        super().__init__(config)
        self.api_key = config.get("api_key") if config else None
        self.model = config.get("model", "default") if config else "default"
        self.temperature = (config.get("temperature", 0.3) if config else 0.3)
        self.max_tokens = (config.get("max_tokens", 100) if config else 100)
        self.use_cache = (config.get("cache", True) if config else True)
        self._cache = {}

        if not self.api_key:
            raise ValueError("api_key is required in config")

    def _get_cache_key(self, input_text: str) -> str:
        """Generate cache key for input."""
        return hashlib.md5(input_text.encode()).hexdigest()

    def _get_cached(self, input_text: str) -> Optional[int]:
        """Get prediction from cache."""
        if not self.use_cache:
            return None
        key = self._get_cache_key(input_text)
        return self._cache.get(key)

    def _set_cached(self, input_text: str, prediction: int):
        """Store prediction in cache."""
        if not self.use_cache:
            return
        key = self._get_cache_key(input_text)
        self._cache[key] = prediction

    def predict(self, input_text: str) -> int:
        """Get prediction from LLM."""
        # Check cache first
        cached = self._get_cached(input_text)
        if cached is not None:
            return cached

        # Call LLM
        result = self._call_api(input_text)
        prediction = self._parse_response(result)

        # Cache result
        self._set_cached(input_text, prediction)

        return prediction

    @abstractmethod
    def _call_api(self, input_text: str) -> str:
        """Call LLM API. Must be implemented by subclass."""
        pass

    @abstractmethod
    def _parse_response(self, response: str) -> int:
        """Parse LLM response to 0/1 prediction."""
        pass


class OpenAIAdapter(LLMAdapter):
    """OpenAI GPT adapter for code quality evaluation."""

    SYSTEM_PROMPT = """You are a code quality evaluator. Analyze the provided code snippet and determine if it demonstrates good coding practices.

Criteria for 'good code' (predict 1):
- Functions/classes with clear purpose and meaningful names
- Proper error handling (try-catch, validation)
- Modularity and reusability (breaks complex logic into functions)
- Uses appropriate design patterns
- Code length > 20 characters suggests non-trivial logic

Criteria for 'simple code' (predict 0):
- Simple assignments or one-liners
- Import statements or variable declarations
- Trivial operations without logic

Respond with ONLY a single number: 0 or 1, followed by brief reasoning."""

    def _call_api(self, input_text: str) -> str:
        """Call OpenAI API."""
        try:
            import openai
        except ImportError:
            raise RuntimeError("openai package required: pip install openai")

        openai.api_key = self.api_key

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": f"Code snippet:\n{input_text}"},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=30,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {e}")

    def _parse_response(self, response: str) -> int:
        """Extract 0 or 1 from response."""
        # First character should be 0 or 1
        for char in response:
            if char in ["0", "1"]:
                return int(char)
        # Default to 0 if parsing fails
        return 0


class GeminiAdapter(LLMAdapter):
    """Google Gemini adapter for code quality evaluation."""

    SYSTEM_PROMPT = """You are a code quality evaluator. Analyze the provided code snippet and determine if it demonstrates good coding practices.

Criteria for 'good code' (predict 1):
- Functions/classes with clear purpose and meaningful names
- Proper error handling (try-catch, validation)
- Modularity and reusability
- Uses appropriate design patterns
- Complex logic (usually > 20 characters)

Criteria for 'simple code' (predict 0):
- Simple assignments or one-liners
- Import statements or variable declarations
- Trivial operations

Respond with ONLY: 0 or 1"""

    def _call_api(self, input_text: str) -> str:
        """Call Google Gemini API."""
        try:
            import google.generativeai as genai
        except ImportError:
            raise RuntimeError("google-generativeai package required: pip install google-generativeai")

        genai.configure(api_key=self.api_key)

        try:
            model = genai.GenerativeModel(self.model)
            prompt = f"{self.SYSTEM_PROMPT}\n\nCode snippet:\n{input_text}"
            response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
            ))
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}")

    def _parse_response(self, response: str) -> int:
        """Extract 0 or 1 from response."""
        for char in response:
            if char in ["0", "1"]:
                return int(char)
        return 0


class AnthropicAdapter(LLMAdapter):
    """Anthropic Claude adapter for code quality evaluation."""

    SYSTEM_PROMPT = """You are a code quality evaluator. Analyze code and predict quality (0 or 1).

Good code (1): functions, error handling, modularity, patterns, logic (len > 20)
Simple code (0): assignments, imports, trivial operations

Respond: 0 or 1 only"""

    def _call_api(self, input_text: str) -> str:
        """Call Anthropic API."""
        try:
            import anthropic
        except ImportError:
            raise RuntimeError("anthropic package required: pip install anthropic")

        client = anthropic.Anthropic(api_key=self.api_key)

        try:
            response = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": f"Code:\n{input_text}"},
                ],
            )
            return response.content[0].text.strip()
        except Exception as e:
            raise RuntimeError(f"Anthropic API error: {e}")

    def _parse_response(self, response: str) -> int:
        """Extract 0 or 1 from response."""
        for char in response:
            if char in ["0", "1"]:
                return int(char)
        return 0
