import logging
import os
from typing import Optional

import google.generativeai as genai
from services.llm_cache import LLMCache
from services.circuit_breaker import CircuitBreaker

logger = logging.getLogger("LLMService")


class LLMService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        api_key = os.getenv("GEMINI_API_KEY")

        # Initialize Cache and Circuit Breaker
        self.cache = LLMCache()
        self.circuit_breaker = CircuitBreaker(name="GeminiAPI", failure_threshold=3)

        if not api_key:
            logger.warning(
                "GEMINI_API_KEY not found. LLM capabilities will be restricted."
            )
            self.model = None
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("models/gemini-2.0-flash")
            logger.info("LLMService initialized with models/gemini-2.0-flash")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self.model = None

    def generate_text(self, prompt: str, use_cache: bool = True) -> Optional[str]:
        if not self.model:
            logger.error("LLM model not initialized.")
            return "Error: LLM not configured."

        # 1. Check Cache
        if use_cache:
            cached = self.cache.get(prompt)
            if cached:
                logger.info("LLM Cache Hit")
                return cached

        # 2. Execute via Circuit Breaker
        try:

            def _call():
                response = self.model.generate_content(prompt)
                return response.text

            result = self.circuit_breaker.call(_call)

            # 3. Store in Cache
            if result and use_cache:
                self.cache.set(prompt, result)

            return result
        except Exception as e:
            logger.error(f"LLM Generation failed: {e}")
            return f"Error communicating with AI service: {e}"

    def review_code(self, code: str, context: str = "") -> str:
        prompt = f"""
        Role: Senior Software Engineer & Security Auditor.
        Task: Review the following code.
        Context: {context}

        Code:
        ```
        {code}
        ```

        Output: valid markdown with findings (Security, Performance, Style) and a PASS/FAIL recommendation.
        """
        return self.generate_text(prompt)

    def generate_solution(self, issue: str) -> str:
        prompt = f"""
        Role: Senior Software Architect.
        Task: Design a technical solution for the following issue.

        Issue:
        {issue}

        Output: A concise implementation plan in markdown.
        """
        return self.generate_text(prompt)
