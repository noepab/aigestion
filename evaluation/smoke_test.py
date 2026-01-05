"""
Smoke test for the evaluation pipeline.

This script runs the pipeline using the `local` adapter (no network calls) and
verifies that a CSV report and HTML dashboard are produced in the specified
output directory.

Usage:
  python smoke_test.py

Exits with code 0 on success, non-zero on failure.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DATASETS_DIR = ROOT / "datasets"
OUTPUT_DIR = ROOT / "reports_smoke_test"
PIPELINE = ROOT / "pipeline.py"

def run(cmd, cwd=None):
    print(f"[CMD] {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=cwd or ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print(r.stdout)
    return r.returncode


def main():
    # prepare output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Run pipeline with local adapter
    cmd = [sys.executable, str(PIPELINE), "--datasets-dir", str(DATASETS_DIR), "--output-dir", str(OUTPUT_DIR), "--adapter", "local"]
    rc = run(cmd)
    if rc != 0:
        print("[ERROR] Pipeline failed")
        sys.exit(rc)

    report = OUTPUT_DIR / "batch_report.csv"
    dashboard = OUTPUT_DIR / "dashboard.html"

    if not report.exists():
        print(f"[ERROR] Expected report not found: {report}")
        sys.exit(2)
    if not dashboard.exists():
        print(f"[ERROR] Expected dashboard not found: {dashboard}")
        sys.exit(3)

    print("[OK] Smoke test succeeded. Generated files:")
    print(f" - {report}")
    print(f" - {dashboard}")
    sys.exit(0)

if __name__ == '__main__':
    main()
