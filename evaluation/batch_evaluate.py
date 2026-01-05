"""
Batch evaluation runner for multiple datasets.

Supports CSV, NDJSON, and JSON formats. Aggregates metrics across datasets
and generates comparison reports.

Usage:
  python batch_evaluate.py --datasets-dir ./datasets
  python batch_evaluate.py --datasets-dir ./datasets --adapter local
  python batch_evaluate.py --datasets-dir ./datasets --adapter api --adapter-config config.json
  python batch_evaluate.py --datasets-dir ./datasets --output report.csv

Outputs metrics table + optional CSV report.
"""
import argparse
import csv
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from datetime import datetime

from metrics import accuracy, precision, recall, f1_score


def load_csv_dataset(path: str) -> List[dict]:
    """Load CSV dataset (id, input, ground_truth, prediction optional)."""
    dataset = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = {
                "id": row.get("id", ""),
                "input": row.get("input", ""),
                "ground_truth": int(row.get("ground_truth", 0)),
            }
            if "prediction" in row and row["prediction"]:
                item["prediction"] = int(row["prediction"])
            dataset.append(item)
    return dataset


def load_ndjson_dataset(path: str) -> List[dict]:
    """Load NDJSON dataset (one JSON object per line)."""
    dataset = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                obj = json.loads(line)
                item = {
                    "id": obj.get("id", ""),
                    "input": obj.get("input", ""),
                    "ground_truth": int(obj.get("ground_truth", 0)),
                }
                if "prediction" in obj:
                    item["prediction"] = int(obj["prediction"])
                dataset.append(item)
    return dataset


def load_json_dataset(path: str) -> List[dict]:
    """Load JSON dataset (array of objects)."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            data = [data]
    return data


def load_dataset(path: str) -> List[dict]:
    """Auto-detect format and load dataset."""
    suffix = Path(path).suffix.lower()
    if suffix == ".csv":
        return load_csv_dataset(path)
    elif suffix == ".ndjson":
        return load_ndjson_dataset(path)
    else:
        return load_json_dataset(path)


def extract_labels(dataset: List[dict]) -> Tuple[list, list]:
    """Extract ground_truth and prediction labels."""
    y_true = []
    y_pred = []
    for item in dataset:
        gt = item.get("ground_truth")
        pred = item.get("prediction")
        y_true.append(1 if gt else 0)
        y_pred.append(1 if pred else 0)
    return y_true, y_pred


def apply_adapter(adapter_name: str, config_path: str, dataset: List[dict]) -> List[dict]:
    """Apply adapter to generate predictions if not already present."""
    try:
        from adapters import LocalPythonAdapter, APIAdapter
        from adapters.utils import apply_adapter as apply_adapter_util

        # Check if predictions already exist
        if all(item.get("prediction") is not None for item in dataset):
            return dataset

        config = {}
        if config_path and os.path.exists(config_path):
            with open(config_path) as f:
                config = json.load(f)

        if adapter_name == "local":
            def simple_model(code: str) -> int:
                return 1 if len(code) > 20 else 0

            adapter = LocalPythonAdapter(config={"func": simple_model})
        elif adapter_name == "api":
            adapter = APIAdapter(config=config)
        else:
            raise ValueError(f"Unknown adapter: {adapter_name}")

        return apply_adapter_util(adapter, dataset)
    except Exception as e:
        print(f"[WARN] Adapter failed: {e}, using existing predictions", file=sys.stderr)
        return dataset


def evaluate_dataset(path: str, adapter_name: str = None, config_path: str = None) -> Dict:
    """Evaluate single dataset and return metrics."""
    dataset = load_dataset(path)

    if adapter_name:
        dataset = apply_adapter(adapter_name, config_path, dataset)

    y_true, y_pred = extract_labels(dataset)

    return {
        "file": Path(path).name,
        "path": path,
        "count": len(dataset),
        "accuracy": round(accuracy(y_true, y_pred), 4),
        "precision": round(precision(y_true, y_pred), 4),
        "recall": round(recall(y_true, y_pred), 4),
        "f1": round(f1_score(y_true, y_pred), 4),
    }


def evaluate_directory(directory: str, adapter_name: str = None, config_path: str = None) -> List[Dict]:
    """Evaluate all datasets in directory."""
    results = []
    dataset_files = []

    for ext in ["*.csv", "*.ndjson", "*.json"]:
        dataset_files.extend(Path(directory).glob(ext))

    if not dataset_files:
        print(f"[WARN] No datasets found in {directory}", file=sys.stderr)
        return results

    for file_path in sorted(dataset_files):
        try:
            result = evaluate_dataset(str(file_path), adapter_name, config_path)
            results.append(result)
        except Exception as e:
            print(f"[ERROR] Failed to evaluate {file_path}: {e}", file=sys.stderr)

    return results


def compute_aggregate_metrics(results: List[Dict]) -> Dict:
    """Compute aggregate metrics across all datasets."""
    if not results:
        return {}

    avg_accuracy = sum(r["accuracy"] for r in results) / len(results)
    avg_precision = sum(r["precision"] for r in results) / len(results)
    avg_recall = sum(r["recall"] for r in results) / len(results)
    avg_f1 = sum(r["f1"] for r in results) / len(results)
    total_count = sum(r["count"] for r in results)

    return {
        "dataset_count": len(results),
        "total_items": total_count,
        "avg_accuracy": round(avg_accuracy, 4),
        "avg_precision": round(avg_precision, 4),
        "avg_recall": round(avg_recall, 4),
        "avg_f1": round(avg_f1, 4),
    }


def print_results(results: List[Dict], aggregate: Dict):
    """Print results table."""
    print("\n" + "=" * 80)
    print("BATCH EVALUATION RESULTS")
    print("=" * 80)

    # Per-dataset results
    print("\nPer-Dataset Metrics:")
    print("-" * 80)
    print(f"{'Dataset':<20} {'Count':>8} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
    print("-" * 80)

    for r in results:
        print(
            f"{r['file']:<20} {r['count']:>8} {r['accuracy']:>10.4f} "
            f"{r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1']:>10.4f}"
        )

    # Aggregate results
    print("\n" + "-" * 80)
    print("Aggregate Metrics:")
    print("-" * 80)
    print(f"Datasets:      {aggregate.get('dataset_count', 0)}")
    print(f"Total Items:   {aggregate.get('total_items', 0)}")
    print(f"Avg Accuracy:  {aggregate.get('avg_accuracy', 0):.4f}")
    print(f"Avg Precision: {aggregate.get('avg_precision', 0):.4f}")
    print(f"Avg Recall:    {aggregate.get('avg_recall', 0):.4f}")
    print(f"Avg F1:        {aggregate.get('avg_f1', 0):.4f}")
    print("=" * 80 + "\n")


def save_csv_report(results: List[Dict], aggregate: Dict, output_path: str):
    """Save results to CSV report."""
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # Header
        writer.writerow(["Batch Evaluation Report", f"Generated: {datetime.now().isoformat()}"])
        writer.writerow([])

        # Per-dataset results
        writer.writerow(["Dataset", "Count", "Accuracy", "Precision", "Recall", "F1"])
        for r in results:
            writer.writerow([r["file"], r["count"], r["accuracy"], r["precision"], r["recall"], r["f1"]])

        # Aggregate results
        writer.writerow([])
        writer.writerow(["Aggregate Metrics"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Datasets", aggregate.get("dataset_count", 0)])
        writer.writerow(["Total Items", aggregate.get("total_items", 0)])
        writer.writerow(["Avg Accuracy", aggregate.get("avg_accuracy", 0)])
        writer.writerow(["Avg Precision", aggregate.get("avg_precision", 0)])
        writer.writerow(["Avg Recall", aggregate.get("avg_recall", 0)])
        writer.writerow(["Avg F1", aggregate.get("avg_f1", 0)])

    print(f"[INFO] Report saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Run batch evaluation on multiple datasets")
    parser.add_argument("--datasets-dir", default=os.path.join(os.path.dirname(__file__), "datasets"))
    parser.add_argument("--adapter", choices=["local", "api"], help="Model adapter to use")
    parser.add_argument("--adapter-config", help="Path to adapter config JSON")
    parser.add_argument("--output", help="Path to save CSV report")
    args = parser.parse_args()

    if not os.path.isdir(args.datasets_dir):
        print(f"[ERROR] Datasets directory not found: {args.datasets_dir}", file=sys.stderr)
        sys.exit(1)

    results = evaluate_directory(args.datasets_dir, args.adapter, args.adapter_config)

    if not results:
        print("[ERROR] No datasets evaluated successfully", file=sys.stderr)
        sys.exit(1)

    aggregate = compute_aggregate_metrics(results)
    print_results(results, aggregate)

    if args.output:
        save_csv_report(results, aggregate, args.output)


if __name__ == "__main__":
    main()
