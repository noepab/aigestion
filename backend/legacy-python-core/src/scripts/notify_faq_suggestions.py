import os

import requests

SUGGESTIONS_FILE = "AIGestion_FAQ_SUGERENCIAS.md"
SLACK_WEBHOOK = os.getenv("AIGESTION_SLACK_WEBHOOK")

if SLACK_WEBHOOK:
    with open(SUGGESTIONS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    msg = f"Nuevas sugerencias de FAQ generadas:\n{content[:1000]}"
    requests.post(SLACK_WEBHOOK, json={"text": msg})
    print("Notificación de sugerencias de FAQ enviada por Slack.")
else:
    print("No se ha configurado el webhook de Slack (AIGESTION_SLACK_WEBHOOK).")
