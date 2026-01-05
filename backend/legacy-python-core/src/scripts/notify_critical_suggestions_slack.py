import json
import os

import requests

FAQ_FILE = "AIGestion_FAQ_SUGERENCIAS.md"
SLACK_WEBHOOK = os.getenv("SLACK_PRIVATE_WEBHOOK")

CRITICAL_KEYWORDS = ["crítico", "urgente", "prioridad alta", "bloqueante"]


def extract_critical_suggestions():
    if not os.path.exists(FAQ_FILE):
        return []
    with open(FAQ_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    critical = [line.strip() for line in lines if any(k in line.lower() for k in CRITICAL_KEYWORDS)]
    return critical

def send_slack_notification(suggestions):
    if not SLACK_WEBHOOK:
        print("No se ha configurado el webhook privado de Slack.")
        return False
    if not suggestions:
        print("No hay sugerencias críticas para notificar.")
        return True
    message = {
        "text": "Sugerencias críticas detectadas:\n" + "\n".join(suggestions)
    }
    response = requests.post(SLACK_WEBHOOK, data=json.dumps(message), headers={"Content-Type": "application/json"})
    if response.status_code == 200:
        print("Notificación enviada correctamente al grupo privado de Slack.")
        return True
    else:
        print(f"Error al enviar notificación: {response.text}")
        return False

def main():
    critical = extract_critical_suggestions()
    send_slack_notification(critical)

if __name__ == "__main__":
    main()
