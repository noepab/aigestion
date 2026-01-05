import os


def notify_error_slack(message):
    slack_webhook = os.environ.get("SLACK_WEBHOOK", "")
    if slack_webhook:
        import requests
        payload = {"text": message}
        try:
            requests.post(slack_webhook, json=payload)
        except Exception as e:
            print(f"Error enviando notificación a Slack: {e}")
    else:
        print("No se ha configurado SLACK_WEBHOOK para notificación de error.")

if __name__ == "__main__":
    notify_error_slack("El workflow de FAQ ha fallado. Revisa los logs y artefactos generados.")
