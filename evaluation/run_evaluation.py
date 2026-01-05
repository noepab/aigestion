"""
Minimal evaluation runner with optional adapter support.

Usage:
  python run_evaluation.py --data sample_dataset.json
  python run_evaluation.py --data sample_dataset.json --adapter local --adapter-config config.json

Outputs a simple metrics table to stdout.
"""
import argparse
import json
import os
import sys
from typing import List

from metrics import accuracy, precision, recall, f1_score


def load_dataset(path: str) -> List[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_labels(dataset: List[dict]):
    y_true = []
    y_pred = []
    for item in dataset:
        gt = item.get("ground_truth")
        pred = item.get("prediction")
        # normalize boolean-like to 0/1
        y_true.append(1 if gt else 0)
        y_pred.append(1 if pred else 0)
    return y_true, y_pred


def apply_adapter(adapter_name: str, config_path: str, dataset: List[dict]) -> List[dict]:
    """Apply adapter to generate predictions if not already present."""
    try:
        from adapters import LocalPythonAdapter, APIAdapter, OpenAIAdapter, GeminiAdapter, AnthropicAdapter
        from adapters.utils import apply_adapter as apply_adapter_util

        # Check if predictions already exist
        if all(item.get("prediction") is not None for item in dataset):
            print("[INFO] Predictions already present in dataset, skipping adapter")
            return dataset

        config = {}
        if config_path and os.path.exists(config_path):
            with open(config_path) as f:
                config = json.load(f)

        if adapter_name == "local":
            # For local adapter, need a function defined elsewhere
            # For demo, use a simple length-based model
            def simple_model(code: str) -> int:
                return 1 if len(code) > 20 else 0

            adapter = LocalPythonAdapter(config={"func": simple_model})
        elif adapter_name == "api":
            adapter = APIAdapter(config=config)
        elif adapter_name == "openai":
            adapter = OpenAIAdapter(config=config)
        elif adapter_name == "gemini":
            adapter = GeminiAdapter(config=config)
        elif adapter_name == "anthropic":
            adapter = AnthropicAdapter(config=config)
        else:
            raise ValueError(f"Unknown adapter: {adapter_name}")

        print(f"[INFO] Applying {adapter_name} adapter...")
        return apply_adapter_util(adapter, dataset)
    except Exception as e:
        print(f"[WARN] Adapter failed: {e}, using existing predictions")
        return dataset


def main():
    parser = argparse.ArgumentParser(description="Run evaluation on dataset")
    parser.add_argument("--data", default=os.path.join(os.path.dirname(__file__), "sample_dataset.json"))
    parser.add_argument("--adapter", choices=["local", "api", "openai", "gemini", "anthropic"], help="Model adapter to use")
    parser.add_argument("--adapter-config", help="Path to adapter config JSON")
    args = parser.parse_args()

    dataset = load_dataset(args.data)

    if args.adapter:
        dataset = apply_adapter(args.adapter, args.adapter_config, dataset)

    y_true, y_pred = extract_labels(dataset)

    print("Dataset:", args.data)
    print("Items:", len(dataset))
    if args.adapter:
        print("Adapter:", args.adapter)
    print("-")
    print("Accuracy:", round(accuracy(y_true, y_pred), 4))
    print("Precision:", round(precision(y_true, y_pred), 4))
    print("Recall:", round(recall(y_true, y_pred), 4))
    print("F1:", round(f1_score(y_true, y_pred), 4))


if __name__ == "__main__":
    main()
