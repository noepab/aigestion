"""Base class for model adapters."""

from abc import ABC, abstractmethod
from typing import Any, Dict


class ModelAdapter(ABC):
    """Abstract base class for model adapters.

    Implement predict() to call your model (local, API, etc.)
    and return a prediction (typically 0 or 1 for binary classification).
    """

    def __init__(self, config: Dict[str, Any] = None):
        """Initialize adapter with optional config."""
        self.config = config or {}

    @abstractmethod
    def predict(self, input_text: str) -> int:
        """
        Predict on a single input.

        Args:
            input_text: input string (e.g., code snippet)

        Returns:
            prediction (0 or 1 for binary classification)
        """
        pass

    def batch_predict(self, inputs: list) -> list:
        """Predict on multiple inputs. Override for efficiency."""
        return [self.predict(inp) for inp in inputs]
