import json
import os

import requests


def send_slack_message(text):
    webhook_url = os.getenv("AIGESTION_SLACK_WEBHOOK")
    if webhook_url:
        requests.post(webhook_url, json={"text": text})


# Analiza satisfacción y envía alerta si hay baja calidad
with open("aigestion_satisfaction.json", "r", encoding="utf-8") as f:
    satisfaction = json.load(f)

low_scores = [s for s in satisfaction if str(s["score"]).lower() in ["nok", "1", "2", "3", "4"]]
if low_scores:
    send_slack_message(
        f"⚠️ Alerta: Se detectaron {len(low_scores)} respuestas de baja calidad en el agente AIGestion."
    )
    print(f"Notificación enviada por baja calidad: {len(low_scores)} casos.")
else:
    print("Calidad OK. No se enviaron alertas.")
