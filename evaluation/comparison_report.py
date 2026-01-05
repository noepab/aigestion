"""
Generate HTML comparison reports from A/B test results.

Creates side-by-side visualizations comparing adapter performance metrics
and agreement statistics.

Usage:
  python comparison_report.py --results ab_test_results.json --output comparison.html
"""
import argparse
import json
import os
from datetime import datetime
from pathlib import Path


def load_results(path: str) -> dict:
    """Load A/B test results from JSON."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_html(results: dict, output_path: str):
    """Generate HTML comparison report."""
    adapter_a = results.get("adapter_a", "Adapter A")
    adapter_b = results.get("adapter_b", "Adapter B")
    agreement = results.get("agreement", {})
    gt_metrics = results.get("ground_truth_metrics")

    # Prepare data for charts
    if gt_metrics:
        metrics_a = gt_metrics["adapter_a"]
        metrics_b = gt_metrics["adapter_b"]
        deltas = gt_metrics["deltas"]

        # Color coding for deltas
        def delta_color(delta):
            if delta > 0.05:
                return "#4CAF50"  # green
            elif delta < -0.05:
                return "#F44336"  # red
            else:
                return "#FFC107"  # yellow

        delta_colors = {k: delta_color(v) for k, v in deltas.items()}
    else:
        metrics_a = metrics_b = deltas = delta_colors = None

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A/B Test Comparison Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}

        header {{
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }}

        h1 {{
            color: #333;
            margin-bottom: 10px;
            font-size: 2em;
        }}

        .subtitle {{
            color: #666;
            font-size: 0.95em;
        }}

        .adapters-header {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }}

        .adapter-label {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 1.1em;
        }}

        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .card {{
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }}

        .card h3 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}

        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}

        th {{
            background: #f5f5f5;
            font-weight: 600;
            color: #333;
        }}

        tr:hover {{
            background: #f9f9f9;
        }}

        .metric-row {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
        }}

        .metric-label {{
            font-weight: 600;
            color: #333;
        }}

        .metric-value {{
            text-align: center;
            font-size: 1.1em;
        }}

        .kappa-box {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
        }}

        .kappa-value {{
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }}

        .kappa-interpretation {{
            font-size: 0.9em;
            opacity: 0.9;
        }}

        .full-width {{
            grid-column: 1 / -1;
        }}

        .chart-wrapper {{
            position: relative;
            height: 300px;
            margin-top: 20px;
        }}

        footer {{
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>⚡ A/B Test Comparison Report</h1>
            <p class="subtitle">Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

            <div class="adapters-header">
                <div class="adapter-label">Adapter A: {adapter_a.upper()}</div>
                <div class="adapter-label">Adapter B: {adapter_b.upper()}</div>
            </div>
        </header>

        <div class="grid">
            <div class="card">
                <h3>📊 Agreement Statistics</h3>
                <table>
                    <tr>
                        <td><strong>Total Items</strong></td>
                        <td>{agreement.get('total', 0)}</td>
                    </tr>
                    <tr>
                        <td><strong>Agreements</strong></td>
                        <td>{agreement.get('agreements', 0)} ({agreement.get('agreement_rate', 0):.1%})</td>
                    </tr>
                    <tr>
                        <td><strong>Adapter A Wins</strong></td>
                        <td>{agreement.get('adapter_a_wins', 0)}</td>
                    </tr>
                    <tr>
                        <td><strong>Adapter B Wins</strong></td>
                        <td>{agreement.get('adapter_b_wins', 0)}</td>
                    </tr>
                </table>
                <div class="kappa-box">
                    <div class="kappa-value">{agreement.get('cohens_kappa', 0):.3f}</div>
                    <div class="kappa-interpretation">Cohen's Kappa (agreement strength)</div>
                </div>
            </div>
"""

    if metrics_a and metrics_b:
        html += f"""            <div class="card">
                <h3>📈 Performance Metrics (vs Ground Truth)</h3>
                <div class="metric-row">
                    <div class="metric-label">Accuracy</div>
                    <div class="metric-value">{metrics_a['accuracy']:.4f}</div>
                    <div class="metric-value">{metrics_b['accuracy']:.4f}</div>
                </div>
                <div class="metric-row">
                    <div class="metric-label">Precision</div>
                    <div class="metric-value">{metrics_a['precision']:.4f}</div>
                    <div class="metric-value">{metrics_b['precision']:.4f}</div>
                </div>
                <div class="metric-row">
                    <div class="metric-label">Recall</div>
                    <div class="metric-value">{metrics_a['recall']:.4f}</div>
                    <div class="metric-value">{metrics_b['recall']:.4f}</div>
                </div>
                <div class="metric-row">
                    <div class="metric-label">F1 Score</div>
                    <div class="metric-value">{metrics_a['f1']:.4f}</div>
                    <div class="metric-value">{metrics_b['f1']:.4f}</div>
                </div>
            </div>"""

    html += """        </div>

        <footer>
            <p>A/B Test Comparison Report • Compare adapter performance to make informed decisions</p>
        </footer>
    </div>
</body>
</html>
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[INFO] Report saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate HTML comparison report from A/B test results")
    parser.add_argument("--results", required=True, help="Path to ab_test_results.json")
    parser.add_argument("--output", default="comparison_report.html", help="Output HTML file path")
    args = parser.parse_args()

    if not os.path.exists(args.results):
        print(f"[ERROR] Results file not found: {args.results}")
        return

    results = load_results(args.results)
    generate_html(results, args.output)


if __name__ == "__main__":
    main()
