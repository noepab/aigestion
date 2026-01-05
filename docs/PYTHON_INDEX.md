# NEXUS V1 Python Codebase Index

This document serves as the master index for all Python code within the NEXUS V1 project.

## 📁 Active Scripts (`server/legacy-python-core/src/scripts/`)

Operational scripts for the help system and automation.

| Script Name | Description | Key Dependencies |
| :--- | :--- | :--- |
| `aig_help_bot.py` | CLI-based help bot interface. Uses `docs/aig_faq.md`. | `docs/aig_faq.md` |
| `aig_help_web.py` | Web-based help bot (Flask). Logs to `logs/`. | `flask`, `docs/aig_faq.md` |
| `analyze_help_queries.py` | Analyzes help query logs. | `pandas`, `logs/` |
| `auto_evaluation.py` | Automated evaluation triggers. | `src.evaluation` |
| `generate_faq_changelog.py` | Generates changelog from FAQs. | - |
| `generate_faq_dashboard.py` | Creates a dashboard view of FAQ stats. | - |
| `notify_critical_suggestions.py` | Sends Slack alerts for critical items. | Slack API |
| `notify_error_slack.py` | General error reporting to Slack. | Slack API |
| `setup.py` | Package installation script. | `setuptools` |

## 🏛️ Engine (`aig-ia-engine/`)

The core AI engine and ML components.

- **backend/**: FastAPI/Flask backend code.
- **ml/**: Machine learning model training scripts.
- **swarm/**: Multi-agent swarm logic.
- **conf/**: Configuration files.

## Usage

To run a script, ensure you are in the root directory and use the relative path:

```bash
python server/legacy-python-core/src/scripts/aig_help_bot.py
```
