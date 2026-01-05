"""
Performance monitoring and degradation detection.

Monitors evaluation metrics over time and alerts when key thresholds are violated.
Detects drops in accuracy, precision, recall, or F1 score.

Usage:
  python performance_monitor.py --report batch_report.csv --threshold-accuracy 0.5 --threshold-f1 0.5
  python performance_monitor.py --history metrics_history.csv --current batch_report.csv

Outputs:
  - Comparison against baseline (if available)
  - Degradation alerts (if metrics drop below threshold)
  - Summary metrics and recommendations
"""
import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


def load_metrics_from_csv(path: str) -> Dict[str, float]:
    """Extract aggregate metrics from batch report CSV."""
    metrics = {}
    current_section = None

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or not row[0].strip():
                continue

            if row[0] == "Aggregate Metrics":
                current_section = "aggregate"
                continue
            elif row[0] == "Metric":
                continue

            if current_section == "aggregate" and len(row) >= 2:
                try:
                    key = row[0].lower().replace(" ", "_")
                    try:
                        value = float(row[1])
                    except ValueError:
                        value = row[1]
                    metrics[key] = value
                except (ValueError, IndexError):
                    pass

    return metrics


def load_history(path: str) -> List[Dict]:
    """Load metrics history from JSON file."""
    if not os.path.exists(path):
        return []

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(path: str, history: List[Dict]):
    """Save metrics history to JSON file."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


def detect_degradation(current: Dict, baseline: Dict, thresholds: Dict) -> Tuple[List[str], bool]:
    """Compare current metrics against baseline and thresholds."""
    alerts = []
    has_degradation = False

    # Check absolute thresholds
    for metric, threshold in thresholds.items():
        key = f"avg_{metric}"
        if key in current:
            value = current[key]
            if value < threshold:
                msg = f"⚠️  {metric.upper()} below threshold: {value:.4f} < {threshold}"
                alerts.append(msg)
                has_degradation = True

    # Check degradation vs baseline
    if baseline:
        for metric in ["avg_accuracy", "avg_precision", "avg_recall", "avg_f1"]:
            if metric in current and metric in baseline:
                curr = current[metric]
                base = baseline[metric]
                delta = curr - base
                pct_change = (delta / base * 100) if base != 0 else 0

                if delta < -0.05:  # More than 5% drop
                    msg = f"📉 {metric} degraded: {base:.4f} → {curr:.4f} ({pct_change:+.1f}%)"
                    alerts.append(msg)
                    has_degradation = True

    return alerts, has_degradation


def print_monitoring_report(
    current: Dict,
    baseline: Dict = None,
    alerts: List[str] = None,
    has_degradation: bool = False,
):
    """Print a monitoring summary report."""
    print("\n" + "=" * 80)
    print("PERFORMANCE MONITORING REPORT")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}")

    print("\nCurrent Metrics:")
    print("-" * 80)
    print(f"Datasets:      {current.get('dataset_count', 0)}")
    print(f"Total Items:   {current.get('total_items', 0)}")
    print(f"Avg Accuracy:  {current.get('avg_accuracy', 0):.4f}")
    print(f"Avg Precision: {current.get('avg_precision', 0):.4f}")
    print(f"Avg Recall:    {current.get('avg_recall', 0):.4f}")
    print(f"Avg F1:        {current.get('avg_f1', 0):.4f}")

    if baseline:
        print("\nComparison to Baseline:")
        print("-" * 80)
        for metric in ["avg_accuracy", "avg_precision", "avg_recall", "avg_f1"]:
            if metric in current and metric in baseline:
                curr = current[metric]
                base = baseline[metric]
                delta = curr - base
                pct = (delta / base * 100) if base != 0 else 0
                symbol = "📈" if delta >= 0 else "📉"
                print(f"{symbol} {metric}: {base:.4f} → {curr:.4f} ({delta:+.4f}, {pct:+.1f}%)")

    if alerts:
        print("\nAlerts:")
        print("-" * 80)
        for alert in alerts:
            print(alert)

    status = "⚠️  DEGRADATION DETECTED" if has_degradation else "✅ METRICS OK"
    print("\n" + "=" * 80)
    print(f"Status: {status}")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Monitor evaluation metrics for degradation")
    parser.add_argument("--report", required=True, help="Current batch report CSV")
    parser.add_argument("--baseline", help="Baseline/previous report CSV for comparison")
    parser.add_argument("--history", help="JSON file to track metrics over time")
    parser.add_argument("--threshold-accuracy", type=float, default=0.5, help="Min accuracy threshold")
    parser.add_argument("--threshold-precision", type=float, default=0.4, help="Min precision threshold")
    parser.add_argument("--threshold-recall", type=float, default=0.4, help="Min recall threshold")
    parser.add_argument("--threshold-f1", type=float, default=0.45, help="Min F1 threshold")
    args = parser.parse_args()

    # Load current metrics
    current = load_metrics_from_csv(args.report)
    print(f"[INFO] Loaded current metrics from {args.report}")

    # Load baseline if provided
    baseline = None
    if args.baseline and os.path.exists(args.baseline):
        baseline = load_metrics_from_csv(args.baseline)
        print(f"[INFO] Loaded baseline metrics from {args.baseline}")

    # Build thresholds
    thresholds = {
        "accuracy": args.threshold_accuracy,
        "precision": args.threshold_precision,
        "recall": args.threshold_recall,
        "f1": args.threshold_f1,
    }

    # Detect degradation
    alerts, has_degradation = detect_degradation(current, baseline, thresholds)

    # Print report
    print_monitoring_report(current, baseline, alerts, has_degradation)

    # Update history
    if args.history:
        history = load_history(args.history)
        entry = {"timestamp": datetime.now().isoformat(), **current}
        history.append(entry)
        save_history(args.history, history)
        print(f"[INFO] Updated metrics history in {args.history}")

    # Exit with appropriate code
    sys.exit(1 if has_degradation else 0)


if __name__ == "__main__":
    main()
