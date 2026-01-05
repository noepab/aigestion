#!/usr/bin/env python3
"""
Quality threshold checker for CI/CD pipelines.

Exits with code 1 if any metric is below threshold.

Usage:
    python check_thresholds.py results/evaluation_results.json
    python check_thresholds.py results/evaluation_results.json --coherence 4.5 --fluency 4.0
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict

DEFAULT_THRESHOLDS = {
    "coherence": 4.0,
    "fluency": 4.0,
    "relevance": 4.0
}


def check_thresholds(results_path: Path, thresholds: Dict[str, float]) -> bool:
    """
    Check if evaluation results meet quality thresholds.

    Args:
        results_path: Path to evaluation_results.json
        thresholds: Dictionary of metric names and minimum thresholds

    Returns:
        bool: True if all metrics pass, False otherwise
    """
    # Load results
    try:
        with open(results_path, 'r', encoding='utf-8') as f:
            results = json.load(f)
    except FileNotFoundError:
        print(f"Error: Results file not found: {results_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in results file: {e}")
        return False

    # Try to get metrics from different possible locations in the JSON
    metrics = results.get("metrics", results.get("average_scores", {}))

    if not metrics:
        print("Error: No metrics found in results file")
        print(f"Available keys: {list(results.keys())}")
        return False

    # Print header
    print("")
    print("=" * 70)
    print(" " * 20 + "QUALITY THRESHOLD CHECK")
    print("=" * 70)
    print("")

    all_passed = True

    # Check each threshold
    for metric_name, threshold in thresholds.items():
        actual = metrics.get(metric_name, 0.0)
        passed = actual >= threshold
        all_passed = all_passed and passed

        # Format status
        if passed:
            status = "✅ PASS"
            status_color = ""
        else:
            status = "❌ FAIL"
            status_color = ""

        # Calculate margin
        margin = actual - threshold
        margin_str = f"({margin:+.2f})" if margin != 0 else ""

        print(f"  {metric_name.ljust(15)} {actual:.2f} >= {threshold:.2f}  ...  {status} {margin_str}")

    print("")
    print("=" * 70)

    # Print summary
    if all_passed:
        print("✅ SUCCESS: All metrics passed quality thresholds!")
        print("")
        return True
    else:
        print("❌ FAILURE: Some metrics failed quality thresholds!")
        print("")
        print("Recommendation: Review responses that scored below threshold")
        print("Run: python evaluate_gemini.py --data <your_data> for detailed analysis")
        print("")
        return False


def print_detailed_failures(results_path: Path, thresholds: Dict[str, float]) -> None:
    """Print detailed information about failed responses."""
    with open(results_path, 'r', encoding='utf-8') as f:
        results = json.load(f)

    rows = results.get("rows", [])

    print("📋 DETAILED FAILURE ANALYSIS")
    print("=" * 70)

    for i, row in enumerate(rows, 1):
        failures = []

        for metric_name, threshold in thresholds.items():
            actual = row.get(metric_name, 0.0)
            if actual < threshold:
                reason = row.get(f"{metric_name}_reason", "No reason provided")
                failures.append({
                    "metric": metric_name,
                    "score": actual,
                    "threshold": threshold,
                    "reason": reason
                })

        if failures:
            print(f"\n[Row {i}] Query: {row.get('query', 'N/A')[:60]}...")
            print(f"Response: {row.get('response', 'N/A')[:80]}...")

            for failure in failures:
                print(f"\n  ❌ {failure['metric']}: {failure['score']:.2f} < {failure['threshold']:.2f}")
                print(f"     Reason: {failure['reason'][:100]}...")

    print("")


def main():
    parser = argparse.ArgumentParser(
        description="Check evaluation quality thresholds for CI/CD",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default thresholds (4.0 for all)
  python check_thresholds.py results/evaluation_results.json

  # Custom thresholds
  python check_thresholds.py results/evaluation_results.json --coherence 4.5

  # Show detailed failures
  python check_thresholds.py results/evaluation_results.json --detailed
        """
    )

    parser.add_argument(
        "results_file",
        type=Path,
        help="Path to evaluation_results.json"
    )

    parser.add_argument(
        "--coherence",
        type=float,
        default=DEFAULT_THRESHOLDS["coherence"],
        help=f"Minimum coherence threshold (default: {DEFAULT_THRESHOLDS['coherence']})"
    )

    parser.add_argument(
        "--fluency",
        type=float,
        default=DEFAULT_THRESHOLDS["fluency"],
        help=f"Minimum fluency threshold (default: {DEFAULT_THRESHOLDS['fluency']})"
    )

    parser.add_argument(
        "--relevance",
        type=float,
        default=DEFAULT_THRESHOLDS["relevance"],
        help=f"Minimum relevance threshold (default: {DEFAULT_THRESHOLDS['relevance']})"
    )

    parser.add_argument(
        "--detailed",
        action="store_true",
        help="Show detailed failure analysis"
    )

    args = parser.parse_args()

    # Build thresholds dict
    thresholds = {
        "coherence": args.coherence,
        "fluency": args.fluency,
        "relevance": args.relevance
    }

    # Check thresholds
    passed = check_thresholds(args.results_file, thresholds)

    # Show detailed failures if requested
    if not passed and args.detailed:
        print_detailed_failures(args.results_file, thresholds)

    # Exit with appropriate code
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
