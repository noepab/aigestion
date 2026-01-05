"""Adapter integration utility."""

from typing import List, Dict, Any
from .base import ModelAdapter


def apply_adapter(adapter: ModelAdapter, dataset: List[dict]) -> List[dict]:
    """Apply adapter to dataset, adding 'prediction' field to each item.

    Args:
        adapter: ModelAdapter instance
        dataset: list of dicts with 'input' field

    Returns:
        dataset with 'prediction' field added to each item
    """
    result = []
    for item in dataset:
        inp = item.get("input", "")
        try:
            pred = adapter.predict(inp)
            item_copy = item.copy()
            item_copy["prediction"] = pred
            result.append(item_copy)
        except Exception as e:
            print(f"[WARN] Adapter failed on item {item.get('id', '?')}: {e}")
            item_copy = item.copy()
            item_copy["prediction"] = 0  # default to 0 on error
            result.append(item_copy)
    return result
