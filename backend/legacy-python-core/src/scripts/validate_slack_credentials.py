import os
import sys

# Validar existencia y formato de la variable de entorno SLACK_WEBHOOK

def validate_slack_credentials():
    slack_webhook = os.environ.get("SLACK_WEBHOOK", "")
    if not slack_webhook:
        print("ERROR: No se ha configurado la variable SLACK_WEBHOOK.")
        sys.exit(1)
    if not slack_webhook.startswith("https://hooks.slack.com/services/"):
        print("ERROR: El formato de SLACK_WEBHOOK no es válido.")
        sys.exit(1)
    print("Credenciales de Slack válidas.")

if __name__ == "__main__":
    validate_slack_credentials()
