"""Local Python model adapter."""

from .base import ModelAdapter


class LocalPythonAdapter(ModelAdapter):
    """Calls a local Python function or class to generate predictions.

    Config:
        func: callable that takes a string and returns 0 or 1

    Example:
        def my_model(code: str) -> int:
            return 1 if len(code) > 50 else 0

        adapter = LocalPythonAdapter(config={"func": my_model})
        pred = adapter.predict("def foo(): pass")
    """

    def predict(self, input_text: str) -> int:
        func = self.config.get("func")
        if not func:
            raise ValueError("LocalPythonAdapter requires 'func' in config")
        result = func(input_text)
        # normalize to 0 or 1
        return 1 if result else 0
