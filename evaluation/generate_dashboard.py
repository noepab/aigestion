"""
Generate interactive HTML dashboard for evaluation metrics.

Reads batch evaluation results and creates visualizations with Chart.js.

Usage:
  python generate_dashboard.py --report batch_report.csv --output dashboard.html
  python generate_dashboard.py --datasets-dir ./datasets --output dashboard.html

Outputs interactive HTML file with charts and metrics summary.
"""
import argparse
import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict


def load_csv_report(path: str) -> Dict:
    """Load CSV report and extract datasets and aggregate metrics."""
    datasets = []
    aggregate = {}
    current_section = None

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or not row[0].strip():
                continue

            if row[0] == "Batch Evaluation Report":
                continue
            elif row[0] == "Dataset":
                current_section = "datasets"
                continue
            elif row[0] == "Aggregate Metrics":
                current_section = "aggregate"
                continue
            elif row[0] == "Metric":
                continue

            if current_section == "datasets" and len(row) >= 5:
                try:
                    datasets.append(
                        {
                            "name": row[0],
                            "count": int(row[1]),
                            "accuracy": float(row[2]),
                            "precision": float(row[3]),
                            "recall": float(row[4]),
                            "f1": float(row[5]) if len(row) > 5 else 0,
                        }
                    )
                except (ValueError, IndexError):
                    pass
            elif current_section == "aggregate" and len(row) >= 2:
                try:
                    key = row[0].lower().replace(" ", "_")
                    value = float(row[1]) if row[1].replace(".", "").isdigit() else row[1]
                    aggregate[key] = value
                except (ValueError, IndexError):
                    pass

    return {"datasets": datasets, "aggregate": aggregate}


def generate_dashboard_html(data: Dict, output_path: str, title: str = "Evaluation Dashboard"):
    """Generate interactive HTML dashboard with Chart.js."""
    if not data.get("datasets"):
        print("[WARN] No datasets in report, creating empty dashboard")
        data["datasets"] = []

    datasets = data["datasets"]
    aggregate = data["aggregate"]

    # Extract data for charts
    dataset_names = [d["name"] for d in datasets]
    accuracy_scores = [d["accuracy"] for d in datasets]
    precision_scores = [d["precision"] for d in datasets]
    recall_scores = [d["recall"] for d in datasets]
    f1_scores = [d["f1"] for d in datasets]
    item_counts = [d["count"] for d in datasets]

    # Determine chart colors (green for good, yellow for medium, red for poor)
    def get_color(score):
        if score >= 0.8:
            return "rgba(75, 192, 75, 0.5)"  # Green
        elif score >= 0.6:
            return "rgba(255, 193, 7, 0.5)"  # Yellow
        else:
            return "rgba(255, 99, 99, 0.5)"  # Red

    accuracy_colors = [get_color(s) for s in accuracy_scores]

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}

        .container {{
            max-width: 1400px;
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
            font-size: 2.5em;
        }}

        .subtitle {{
            color: #666;
            font-size: 0.95em;
        }}

        .metrics-summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }}

        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }}

        .metric-card .label {{
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 10px;
        }}

        .metric-card .value {{
            font-size: 2em;
            font-weight: bold;
        }}

        .charts-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .chart-container {{
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            position: relative;
        }}

        .chart-container h3 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
        }}

        .chart-wrapper {{
            position: relative;
            height: 400px;
        }}

        .full-width {{
            grid-column: 1 / -1;
        }}

        .full-width .chart-wrapper {{
            height: 350px;
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

        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}

        th, td {{
            padding: 12px;
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
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 {title}</h1>
            <p class="subtitle">Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

            <div class="metrics-summary">
                <div class="metric-card">
                    <div class="label">Datasets</div>
                    <div class="value">{len(datasets)}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Total Items</div>
                    <div class="value">{aggregate.get('total_items', 0)}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Avg Accuracy</div>
                    <div class="value">{aggregate.get('avg_accuracy', 0):.3f}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Avg F1</div>
                    <div class="value">{aggregate.get('avg_f1', 0):.3f}</div>
                </div>
            </div>
        </header>

        <div class="charts-grid">
            <div class="chart-container">
                <h3>📈 Accuracy by Dataset</h3>
                <div class="chart-wrapper">
                    <canvas id="accuracyChart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>🎯 Precision & Recall</h3>
                <div class="chart-wrapper">
                    <canvas id="precisionRecallChart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>📊 F1 Score Distribution</h3>
                <div class="chart-wrapper">
                    <canvas id="f1Chart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>📦 Dataset Sizes</h3>
                <div class="chart-wrapper">
                    <canvas id="sizeChart"></canvas>
                </div>
            </div>

            <div class="chart-container full-width">
                <h3>📋 All Metrics Comparison</h3>
                <div class="chart-wrapper">
                    <canvas id="allMetricsChart"></canvas>
                </div>
            </div>
        </div>

        <div class="chart-container full-width">
            <h3>📑 Detailed Results</h3>
            <table>
                <thead>
                    <tr>
                        <th>Dataset</th>
                        <th>Items</th>
                        <th>Accuracy</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                    </tr>
                </thead>
                <tbody>
"""

    for d in datasets:
        html_content += f"""                    <tr>
                        <td><strong>{d['name']}</strong></td>
                        <td>{d['count']}</td>
                        <td>{d['accuracy']:.4f}</td>
                        <td>{d['precision']:.4f}</td>
                        <td>{d['recall']:.4f}</td>
                        <td>{d['f1']:.4f}</td>
                    </tr>
"""

    html_content += """                </tbody>
            </table>
        </div>

        <footer>
            <p>Generated by Evaluation Framework • All metrics computed independently</p>
        </footer>
    </div>

    <script>
        const ctx1 = document.getElementById('accuracyChart').getContext('2d');
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: """ + json.dumps(dataset_names) + """,
                datasets: [{
                    label: 'Accuracy',
                    data: """ + json.dumps(accuracy_scores) + """,
                    backgroundColor: """ + json.dumps(accuracy_colors) + """,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, max: 1 }
                }
            }
        });

        const ctx2 = document.getElementById('precisionRecallChart').getContext('2d');
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: """ + json.dumps(dataset_names) + """,
                datasets: [
                    {
                        label: 'Precision',
                        data: """ + json.dumps(precision_scores) + """,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Recall',
                        data: """ + json.dumps(recall_scores) + """,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, max: 1 }
                }
            }
        });

        const ctx3 = document.getElementById('f1Chart').getContext('2d');
        new Chart(ctx3, {
            type: 'radar',
            data: {
                labels: """ + json.dumps(dataset_names) + """,
                datasets: [{
                    label: 'F1 Score',
                    data: """ + json.dumps(f1_scores) + """,
                    borderColor: 'rgba(75, 192, 75, 1)',
                    backgroundColor: 'rgba(75, 192, 75, 0.2)',
                    pointBackgroundColor: 'rgba(75, 192, 75, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    r: { beginAtZero: true, max: 1 }
                }
            }
        });

        const ctx4 = document.getElementById('sizeChart').getContext('2d');
        new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: """ + json.dumps(dataset_names) + """,
                datasets: [{
                    data: """ + json.dumps(item_counts) + """,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        const ctx5 = document.getElementById('allMetricsChart').getContext('2d');
        new Chart(ctx5, {
            type: 'bar',
            data: {
                labels: """ + json.dumps(dataset_names) + """,
                datasets: [
                    {
                        label: 'Accuracy',
                        data: """ + json.dumps(accuracy_scores) + """,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    },
                    {
                        label: 'Precision',
                        data: """ + json.dumps(precision_scores) + """,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)'
                    },
                    {
                        label: 'Recall',
                        data: """ + json.dumps(recall_scores) + """,
                        backgroundColor: 'rgba(75, 192, 75, 0.7)'
                    },
                    {
                        label: 'F1',
                        data: """ + json.dumps(f1_scores) + """,
                        backgroundColor: 'rgba(255, 206, 86, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, max: 1 }
                }
            }
        });
    </script>
</body>
</html>
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[INFO] Dashboard saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate interactive HTML dashboard from evaluation results")
    parser.add_argument("--report", help="Path to CSV report file")
    parser.add_argument("--output", default="dashboard.html", help="Output HTML file path")
    parser.add_argument("--title", default="Evaluation Dashboard", help="Dashboard title")
    args = parser.parse_args()

    if not args.report:
        print("[ERROR] --report is required", file=sys.__exit__)
        return

    if not os.path.exists(args.report):
        print(f"[ERROR] Report file not found: {args.report}")
        return

    data = load_csv_report(args.report)
    generate_dashboard_html(data, args.output, args.title)
    print(f"[INFO] Open {args.output} in a browser to view the dashboard")


if __name__ == "__main__":
    main()
