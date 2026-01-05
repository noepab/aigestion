#!/usr/bin/env python3
"""
Complete evaluation pipeline: run batch eval and generate dashboard.

Usage:
  python pipeline.py --datasets-dir ./datasets --output-dir ./reports
  python pipeline.py --datasets-dir ./datasets --adapter local --output-dir ./reports
  python pipeline.py --datasets-dir ./datasets --adapter api --adapter-config config.json --output-dir ./reports

Outputs batch_report.csv and dashboard.html in output directory.
"""
import argparse
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def run_batch_evaluation(datasets_dir: str, output_dir: str, adapter: str = None, config: str = None) -> str:
    """Run batch evaluation and return report path."""
    report_path = os.path.join(output_dir, "batch_report.csv")

    cmd = [sys.executable, "batch_evaluate.py", "--datasets-dir", datasets_dir, "--output", report_path]

    if adapter:
        cmd.extend(["--adapter", adapter])
    if config:
        cmd.extend(["--adapter-config", config])

    print(f"[INFO] Running batch evaluation...")
    print(f"[CMD] {' '.join(cmd)}")

    result = subprocess.run(cmd, cwd=os.path.dirname(__file__))
    if result.returncode != 0:
        print("[ERROR] Batch evaluation failed")
        sys.exit(1)

    return report_path


def generate_dashboard(report_path: str, output_dir: str) -> str:
    """Generate dashboard from report."""
    dashboard_path = os.path.join(output_dir, "dashboard.html")

    cmd = [sys.executable, "generate_dashboard.py", "--report", report_path, "--output", dashboard_path]

    print(f"[INFO] Generating dashboard...")
    print(f"[CMD] {' '.join(cmd)}")

    result = subprocess.run(cmd, cwd=os.path.dirname(__file__))
    if result.returncode != 0:
        print("[ERROR] Dashboard generation failed")
        sys.exit(1)

    return dashboard_path


def main():
    parser = argparse.ArgumentParser(description="Complete evaluation pipeline (batch eval + dashboard)")
    parser.add_argument("--datasets-dir", required=True, help="Directory with datasets")
    parser.add_argument("--output-dir", default="./reports", help="Output directory for reports")
    parser.add_argument("--adapter", choices=["local", "api"], help="Model adapter to use")
    parser.add_argument("--adapter-config", help="Path to adapter config JSON")
    args = parser.parse_args()

    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)

    # Run batch evaluation
    report_path = run_batch_evaluation(args.datasets_dir, args.output_dir, args.adapter, args.adapter_config)

    # Generate dashboard
    dashboard_path = generate_dashboard(report_path, args.output_dir)

    print("\n" + "=" * 80)
    print("PIPELINE COMPLETE")
    print("=" * 80)
    print(f"Report:    {report_path}")
    print(f"Dashboard: {dashboard_path}")
    print("\nOpen dashboard.html in your browser to view interactive visualizations")
    print("=" * 80)


if __name__ == "__main__":
    main()
