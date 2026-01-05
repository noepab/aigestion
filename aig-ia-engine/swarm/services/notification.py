import logging
import os
from datetime import datetime

import requests

logger = logging.getLogger("NotificationService")


class NotificationService:
    def __init__(self):
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL")  # Optional

    def notify(self, title: str, message: str, level: str = "INFO"):
        """Send a notification via configured channels."""

        # 1. Log to console/file
        log_msg = f"[{title}] {message}"
        if level == "ERROR":
            logger.error(log_msg)
        else:
            logger.info(log_msg)

        # 2. Webhook (if configured)
        if self.webhook_url:
            self._send_webhook(title, message, level)

    def _send_webhook(self, title, message, level):
        try:
            color = 0x00FF00 if level == "INFO" else 0xFF0000
            payload = {
                "embeds": [
                    {
                        "title": f"🌌 AIGestion Swarm: {title}",
                        "description": message,
                        "color": color,
                        "timestamp": datetime.now().isoformat(),
                    }
                ]
            }
            requests.post(self.webhook_url, json=payload, timeout=2)
        except Exception as e:
            logger.warning(f"Failed to send webhook: {e}")
