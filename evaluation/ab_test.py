"""
A/B testing framework for evaluating different model adapters.

Compares predictions from two adapters and computes statistical metrics:
- Win/Loss/Tie counts
- Accuracy delta
- Cohen's kappa (inter-rater agreement)
- Confusion matrix

Usage:
  python ab_test.py --dataset ./sample_dataset.json --adapter-a local --adapter-b openai --config-a config_a.json --config-b config_b.json
  python ab_test.py --dataset ./sample_dataset.json --adapter-a local --adapter-b api --config-b api_config.json

Outputs comparison table and kappa statistic.
"""
import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple

from metrics import accuracy, precision, recall, f1_score


def load_dataset(path: str) -> List[dict]:
    """Load dataset from JSON."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            data = [data]
    return data


def get_adapter(adapter_name: str, config_path: str = None) -> object:
    """Get adapter instance by name."""
    try:
        from adapters import (
            LocalPythonAdapter,
            APIAdapter,
            OpenAIAdapter,
            GeminiAdapter,
            AnthropicAdapter,
        )
    except ImportError as e:
        print(f"[ERROR] Could not import adapters: {e}")
        sys.exit(1)

    config = {}
    if config_path and os.path.exists(config_path):
        with open(config_path) as f:
            config = json.load(f)

    if adapter_name == "local":
        def simple_model(code: str) -> int:
            return 1 if len(code) > 20 else 0

        return LocalPythonAdapter(config={"func": simple_model})
    elif adapter_name == "api":
        return APIAdapter(config=config)
    elif adapter_name == "openai":
        return OpenAIAdapter(config=config)
    elif adapter_name == "gemini":
        return GeminiAdapter(config=config)
    elif adapter_name == "anthropic":
        return AnthropicAdapter(config=config)
    else:
        raise ValueError(f"Unknown adapter: {adapter_name}")


def run_predictions(adapter, dataset: List[dict]) -> List[int]:
    """Generate predictions from adapter for all items."""
    predictions = []
    for item in dataset:
        try:
            pred = adapter.predict(item.get("input", ""))
            predictions.append(1 if pred else 0)
        except Exception as e:
            print(f"[WARN] Prediction failed for {item.get('id', '?')}: {e}")
            predictions.append(0)
    return predictions


def compute_agreement_stats(y_pred_a: List[int], y_pred_b: List[int]) -> Dict:
    """Compute agreement statistics between two prediction lists."""
    if len(y_pred_a) != len(y_pred_b):
        raise ValueError("Prediction lists must be same length")

    n = len(y_pred_a)
    agreements = sum(1 for a, b in zip(y_pred_a, y_pred_b) if a == b)
    a_wins = sum(1 for a, b in zip(y_pred_a, y_pred_b) if a == 1 and b == 0)
    b_wins = sum(1 for a, b in zip(y_pred_a, y_pred_b) if a == 0 and b == 1)
    both_positive = sum(1 for a, b in zip(y_pred_a, y_pred_b) if a == 1 and b == 1)
    both_negative = sum(1 for a, b in zip(y_pred_a, y_pred_b) if a == 0 and b == 0)

    # Cohen's Kappa: measures inter-rater agreement beyond chance
    # kappa = (po - pe) / (1 - pe)
    # po = observed agreement, pe = expected by chance
    po = agreements / n
    p_a1 = sum(y_pred_a) / n
    p_b1 = sum(y_pred_b) / n
    pe = (p_a1 * p_b1) + ((1 - p_a1) * (1 - p_b1))
    kappa = (po - pe) / (1 - pe) if pe != 1 else 1.0

    return {
        "total": n,
        "agreements": agreements,
        "agreement_rate": round(agreements / n, 4),
        "adapter_a_wins": a_wins,
        "adapter_b_wins": b_wins,
        "both_positive": both_positive,
        "both_negative": both_negative,
        "cohens_kappa": round(kappa, 4),
    }


def compare_to_ground_truth(
    y_true: List[int], y_pred_a: List[int], y_pred_b: List[int]
) -> Dict:
    """Compare both adapters to ground truth."""
    acc_a = accuracy(y_true, y_pred_a)
    acc_b = accuracy(y_true, y_pred_b)
    prec_a = precision(y_true, y_pred_a)
    prec_b = precision(y_true, y_pred_b)
    rec_a = recall(y_true, y_pred_a)
    rec_b = recall(y_true, y_pred_b)
    f1_a = f1_score(y_true, y_pred_a)
    f1_b = f1_score(y_true, y_pred_b)

    return {
        "adapter_a": {
            "accuracy": round(acc_a, 4),
            "precision": round(prec_a, 4),
            "recall": round(rec_a, 4),
            "f1": round(f1_a, 4),
        },
        "adapter_b": {
            "accuracy": round(acc_b, 4),
            "precision": round(prec_b, 4),
            "recall": round(rec_b, 4),
            "f1": round(f1_b, 4),
        },
        "deltas": {
            "accuracy_delta": round(acc_b - acc_a, 4),
            "precision_delta": round(prec_b - prec_a, 4),
            "recall_delta": round(rec_b - rec_a, 4),
            "f1_delta": round(f1_b - f1_a, 4),
        },
    }


def print_report(adapter_a: str, adapter_b: str, agreement: Dict, ground_truth: Dict = None):
    """Print A/B test report."""
    print("\n" + "=" * 80)
    print("A/B TEST REPORT")
    print("=" * 80)
    print(f"\nAdapter A: {adapter_a}")
    print(f"Adapter B: {adapter_b}")

    print(f"\nAgreement Statistics:")
    print(f"  Total items: {agreement['total']}")
    print(f"  Agreements: {agreement['agreements']} ({agreement['agreement_rate']:.1%})")
    print(f"  Adapter A wins: {agreement['adapter_a_wins']}")
    print(f"  Adapter B wins: {agreement['adapter_b_wins']}")
    print(f"  Cohen's Kappa: {agreement['cohens_kappa']:.4f}")
    if agreement['cohens_kappa'] > 0.8:
        print(f"    → Almost perfect agreement")
    elif agreement['cohens_kappa'] > 0.6:
        print(f"    → Substantial agreement")
    elif agreement['cohens_kappa'] > 0.4:
        print(f"    → Moderate agreement")
    else:
        print(f"    → Fair to poor agreement")

    if ground_truth:
        print(f"\nPerformance vs Ground Truth:")
        print(f"\n{'Metric':<15} {'Adapter A':>12} {'Adapter B':>12} {'Delta':>12}")
        print("-" * 51)
        for metric in ["accuracy", "precision", "recall", "f1"]:
            val_a = ground_truth["adapter_a"][metric]
            val_b = ground_truth["adapter_b"][metric]
            delta = ground_truth["deltas"][f"{metric}_delta"]
            arrow = "↑" if delta > 0 else "↓" if delta < 0 else "→"
            print(f"{metric:<15} {val_a:>12.4f} {val_b:>12.4f} {delta:>10.4f} {arrow}")

    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Run A/B test comparing two adapters")
    parser.add_argument("--dataset", required=True, help="Path to evaluation dataset (JSON)")
    parser.add_argument("--adapter-a", required=True, choices=["local", "api", "openai", "gemini", "anthropic"])
    parser.add_argument("--adapter-b", required=True, choices=["local", "api", "openai", "gemini", "anthropic"])
    parser.add_argument("--config-a", help="Config file for adapter A")
    parser.add_argument("--config-b", help="Config file for adapter B")
    args = parser.parse_args()

    if not os.path.exists(args.dataset):
        print(f"[ERROR] Dataset not found: {args.dataset}")
        sys.exit(1)

    print("[INFO] Loading dataset...")
    dataset = load_dataset(args.dataset)

    print(f"[INFO] Initializing adapters...")
    adapter_a = get_adapter(args.adapter_a, args.config_a)
    adapter_b = get_adapter(args.adapter_b, args.config_b)

    print(f"[INFO] Running predictions from Adapter A...")
    pred_a = run_predictions(adapter_a, dataset)

    print(f"[INFO] Running predictions from Adapter B...")
    pred_b = run_predictions(adapter_b, dataset)

    agreement = compute_agreement_stats(pred_a, pred_b)

    # Compare to ground truth if available
    ground_truth_metrics = None
    if all("ground_truth" in item for item in dataset):
        y_true = [1 if item.get("ground_truth") else 0 for item in dataset]
        ground_truth_metrics = compare_to_ground_truth(y_true, pred_a, pred_b)

    print_report(args.adapter_a, args.adapter_b, agreement, ground_truth_metrics)

    # Save results to JSON
    results = {
        "adapter_a": args.adapter_a,
        "adapter_b": args.adapter_b,
        "agreement": agreement,
        "ground_truth_metrics": ground_truth_metrics,
    }
    output_path = Path(args.dataset).parent / "ab_test_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[INFO] Results saved to {output_path}")


if __name__ == "__main__":
    main()
