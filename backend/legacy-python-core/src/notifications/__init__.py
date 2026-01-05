"""
Notifications Module - Sistema de notificaciones AIGestion
=====================================================

Contiene:
- slack: Integraciones con Slack (alertas, sugerencias críticas)
- email: Notificaciones por email (futuro)
- quality: Alertas de calidad del agente

Uso:
    from src.notifications import slack
    slack.notify_critical_suggestions()
"""

from src.notifications import slack

__all__ = ["slack"]
