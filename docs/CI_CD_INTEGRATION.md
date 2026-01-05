# Evaluation CI/CD Integration Guide

Guía para integrar el framework de evaluación en pipelines de CI/CD de NEXUS V1.

## 🎯 Objetivo

Ejecutar evaluaciones automáticas en cada deploy o cambio significativo en la API de Gemini para detectar degradación de calidad.

## 🔄 Workflow Recomendado

### Opción 1: GitHub Actions (Evaluación en PR)

Evaluar cambios antes de merge:

```yaml
# .github/workflows/evaluate-gemini-api.yml
name: Evaluate Gemini API Quality

on:
  pull_request:
    paths:
      - 'server/src/controllers/ai.controller.ts'
      - 'server/src/services/**'
  workflow_dispatch:

jobs:
  evaluate:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../evaluation/NEXUS V1 && pip install -r requirements.txt

      - name: Start NEXUS V1 server
        run: |
          cd server
          npm run dev &
          sleep 30  # Wait for server to be ready
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          MONGODB_URI: mongodb://localhost:27017/NEXUS V1-test

      - name: Collect responses
        run: |
          cd evaluation/NEXUS V1
          python collect_responses.py --api-url http://localhost:3000

      - name: Run evaluation
        run: |
          cd evaluation/NEXUS V1
          python evaluate_gemini.py
        env:
          AZURE_OPENAI_ENDPOINT: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          AZURE_OPENAI_KEY: ${{ secrets.AZURE_OPENAI_KEY }}
          AZURE_OPENAI_DEPLOYMENT: gpt-4

      - name: Check quality thresholds
        run: |
          cd evaluation/NEXUS V1
          python check_thresholds.py results/evaluation_results.json

      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: evaluation-results
          path: evaluation/NEXUS V1/results/

      - name: Comment PR with results
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('evaluation/NEXUS V1/results/evaluation_results.json', 'utf8'));

            const comment = `## 📊 Gemini API Evaluation Results

            | Metric | Score | Status |
            |--------|-------|--------|
            | Coherence | ${results.metrics.coherence.toFixed(2)} | ${results.metrics.coherence >= 4.0 ? '✅' : '⚠️'} |
            | Fluency | ${results.metrics.fluency.toFixed(2)} | ${results.metrics.fluency >= 4.0 ? '✅' : '⚠️'} |
            | Relevance | ${results.metrics.relevance.toFixed(2)} | ${results.metrics.relevance >= 4.0 ? '✅' : '⚠️'} |

            **Threshold:** 4.0 for all metrics

            <details>
            <summary>View detailed results</summary>

            \`\`\`json
            ${JSON.stringify(results.metrics, null, 2)}
            \`\`\`
            </details>
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Opción 2: Evaluación Scheduled (Monitoreo Continuo)

Ejecutar evaluaciones periódicas en producción:

```yaml
# .github/workflows/scheduled-evaluation.yml
name: Scheduled Gemini API Evaluation

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:

jobs:
  evaluate-production:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd evaluation/NEXUS V1
          pip install -r requirements.txt

      - name: Collect responses from production
        run: |
          cd evaluation/NEXUS V1
          python collect_responses.py --api-url https://NEXUS V1-production.example.com

      - name: Run evaluation
        run: |
          cd evaluation/NEXUS V1
          python evaluate_gemini.py --output results-$(date +%Y%m%d)/
        env:
          AZURE_OPENAI_ENDPOINT: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          AZURE_OPENAI_KEY: ${{ secrets.AZURE_OPENAI_KEY }}
          AZURE_OPENAI_DEPLOYMENT: gpt-4

      - name: Archive results
        run: |
          cd evaluation/NEXUS V1
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add results-*/
          git commit -m "chore: Add weekly evaluation results $(date +%Y-%m-%d)"
          git push

      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        if: failure()
        with:
          payload: |
            {
              "text": "⚠️ Gemini API evaluation failed! Check results in GitHub Actions."
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🛡️ Quality Threshold Check Script

Crear `evaluation/NEXUS V1/check_thresholds.py`:

```python
#!/usr/bin/env python3
"""
Quality threshold checker for CI/CD pipelines.

Exits with code 1 if any metric is below threshold.
"""

import json
import sys
import argparse
from pathlib import Path

DEFAULT_THRESHOLDS = {
    "coherence": 4.0,
    "fluency": 4.0,
    "relevance": 4.0
}


def check_thresholds(results_path: Path, thresholds: dict) -> bool:
    """Check if evaluation results meet quality thresholds."""
    with open(results_path, 'r') as f:
        results = json.load(f)

    metrics = results.get("metrics", {})

    print("=" * 60)
    print("QUALITY THRESHOLD CHECK")
    print("=" * 60)

    all_passed = True

    for metric_name, threshold in thresholds.items():
        actual = metrics.get(metric_name, 0.0)
        passed = actual >= threshold
        all_passed = all_passed and passed

        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{metric_name}: {actual:.2f} >= {threshold:.2f} ... {status}")

    print("=" * 60)

    if all_passed:
        print("✅ All metrics passed quality thresholds!")
        return True
    else:
        print("❌ Some metrics failed quality thresholds!")
        return False


def main():
    parser = argparse.ArgumentParser(description="Check evaluation quality thresholds")
    parser.add_argument("results_file", type=Path, help="Path to evaluation_results.json")
    parser.add_argument("--coherence", type=float, default=4.0)
    parser.add_argument("--fluency", type=float, default=4.0)
    parser.add_argument("--relevance", type=float, default=4.0)

    args = parser.parse_args()

    thresholds = {
        "coherence": args.coherence,
        "fluency": args.fluency,
        "relevance": args.relevance
    }

    passed = check_thresholds(args.results_file, thresholds)

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
```

## 🔐 Secrets Configuration

Configurar en GitHub Settings > Secrets and variables > Actions:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | `https://your-resource.openai.azure.com/` |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key | `abc123...` |
| `SLACK_WEBHOOK_URL` | Slack webhook for alerts | `https://hooks.slack.com/...` |

## 📊 Tracking Metrics Over Time

### Almacenar Histórico

```bash
# Crear directorio para resultados históricos
mkdir -p evaluation/NEXUS V1/history

# En CI, guardar resultados con timestamp
cp results/evaluation_results.json "history/results-$(date +%Y%m%d-%H%M%S).json"
```

### Analizar Tendencias

Crear script `analyze_trends.py`:

```python
import json
import glob
from pathlib import Path
from datetime import datetime

def analyze_trends(history_dir: Path):
    """Analyze evaluation trends over time."""
    results_files = sorted(glob.glob(str(history_dir / "results-*.json")))

    metrics_over_time = []

    for file_path in results_files:
        with open(file_path, 'r') as f:
            data = json.load(f)
            timestamp = Path(file_path).stem.replace("results-", "")

            metrics_over_time.append({
                "timestamp": timestamp,
                "coherence": data["metrics"]["coherence"],
                "fluency": data["metrics"]["fluency"],
                "relevance": data["metrics"]["relevance"]
            })

    # Print trend summary
    print("\n📈 EVALUATION TRENDS")
    print("=" * 60)

    for i, metrics in enumerate(metrics_over_time[-5:]):  # Last 5 evaluations
        print(f"\n{metrics['timestamp']}")
        print(f"  Coherence: {metrics['coherence']:.2f}")
        print(f"  Fluency: {metrics['fluency']:.2f}")
        print(f"  Relevance: {metrics['relevance']:.2f}")

    # Calculate trend (last vs first in window)
    if len(metrics_over_time) >= 2:
        first = metrics_over_time[0]
        last = metrics_over_time[-1]

        print("\n📊 TREND (First vs Last)")
        print("=" * 60)

        for metric in ["coherence", "fluency", "relevance"]:
            change = last[metric] - first[metric]
            arrow = "📈" if change > 0 else "📉" if change < 0 else "➡️"
            print(f"{metric}: {arrow} {change:+.2f}")

if __name__ == "__main__":
    analyze_trends(Path("history"))
```

## 🚨 Alertas y Notificaciones

### Slack Webhook

```python
import requests
import json

def send_slack_alert(webhook_url: str, metrics: dict):
    """Send Slack notification if metrics are below threshold."""
    failed_metrics = [
        f"• {name}: {value:.2f}"
        for name, value in metrics.items()
        if value < 4.0
    ]

    if failed_metrics:
        message = {
            "text": "⚠️ Gemini API Quality Alert",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Failed Metrics:*\n" + "\n".join(failed_metrics)
                    }
                }
            ]
        }

        requests.post(webhook_url, json=message)
```

## 📝 Best Practices

1. **Threshold Configuration**: Ajustar umbrales según tus requisitos de calidad
2. **Dataset Management**: Actualizar `test_dataset.jsonl` regularmente con casos reales
3. **Result Archiving**: Mantener histórico de evaluaciones para análisis de tendencias
4. **Alert Fatigue**: Solo alertar en degradación significativa (> 0.5 puntos)
5. **Cost Management**: Limitar evaluaciones scheduled para controlar costos de Azure OpenAI

## 🔗 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- [NEXUS V1 Evaluation Framework](./README.md)

---

**Status:** 🚧 Plantilla lista para implementación
**Next Steps:** Ajustar workflows según necesidades específicas de NEXUS V1

