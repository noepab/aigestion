"""HTTP API model adapter."""

import json
from typing import Any, Dict
from .base import ModelAdapter

try:
    import requests
except ImportError:
    requests = None


class APIAdapter(ModelAdapter):
    """Calls an HTTP API endpoint to generate predictions.

    Config:
        url: endpoint URL (must accept POST with JSON)
        input_field: JSON field name for input (default: "input")
        output_field: JSON field name for output (default: "prediction")
        headers: optional HTTP headers dict

    Example:
        adapter = APIAdapter(config={
            "url": "http://localhost:8000/predict",
            "input_field": "text",
            "output_field": "label"
        })
        pred = adapter.predict("some code")
    """

    def predict(self, input_text: str) -> int:
        if not requests:
            raise ImportError("requests library required for APIAdapter")

        url = self.config.get("url")
        if not url:
            raise ValueError("APIAdapter requires 'url' in config")

        input_field = self.config.get("input_field", "input")
        output_field = self.config.get("output_field", "prediction")
        headers = self.config.get("headers", {})

        payload = {input_field: input_text}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            result = data.get(output_field, 0)
            return 1 if result else 0
        except Exception as e:
            raise RuntimeError(f"API call failed: {e}")
