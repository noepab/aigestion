"""
Slack Notifications - Integraciones con Slack para AIGestion
=======================================================

Funcionalidades:
- Notificaciones de sugerencias críticas
- Alertas de errores
- Reportes de calidad del agente
- Webhooks configurables

Configuración via ENV:
- SLACK_WEBHOOK: Webhook general
- SLACK_PRIVATE_WEBHOOK: Webhook para canal privado
- SLACK_ERROR_WEBHOOK: Webhook para alertas de errores

Uso:
    from src.notifications.slack import notify_critical_suggestions, notify_error

    notify_critical_suggestions()
    notify_error("Error crítico en el sistema")
"""

import json
import logging
import os
from pathlib import Path

import requests

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_FILE = PROJECT_ROOT / "logs" / "notifications.log"

# Archivos de referencia
FAQ_SUGGESTIONS_FILE = PROJECT_ROOT / "docs" / "AIGestion_FAQ_SUGERENCIAS.md"
QUALITY_METRICS_FILE = PROJECT_ROOT / "data" / "quality_metrics.json"

# Webhooks
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK")
SLACK_PRIVATE_WEBHOOK = os.getenv("SLACK_PRIVATE_WEBHOOK")
SLACK_ERROR_WEBHOOK = os.getenv("SLACK_ERROR_WEBHOOK")

# Palabras clave para detección de prioridad
CRITICAL_KEYWORDS = ["crítico", "urgente", "prioridad alta", "bloqueante", "fallo", "error"]
WARNING_KEYWORDS = ["advertencia", "atención", "revisar", "pendiente"]

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [Slack] %(message)s",
)
logger = logging.getLogger("AIGestion.Slack")


# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

def send_slack_message(
    webhook_url: str,
    message: str,
    title: str = None,
    color: str = "#6366f1",
    emoji: str = ":robot_face:"
) -> bool:
    """
    Envía un mensaje a Slack usando webhook.

    Args:
        webhook_url: URL del webhook
        message: Texto del mensaje
        title: Título opcional (para attachment)
        color: Color del attachment (#hex)
        emoji: Emoji del bot

    Returns:
        True si se envió correctamente, False en caso contrario
    """
    if not webhook_url:
        logger.warning("Webhook URL not configured")
        return False

    payload = {
        "icon_emoji": emoji,
        "username": "AIGestion Bot",
    }

    if title:
        payload["attachments"] = [
            {
                "title": title,
                "text": message,
                "color": color,
                "footer": "AIGestion Notification System",
            }
        ]
    else:
        payload["text"] = message

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            logger.info(f"Slack message sent successfully: {title or message[:50]}...")
            return True
        else:
            logger.error(f"Slack API error: {response.status_code} - {response.text}")
            return False

    except requests.RequestException as e:
        logger.error(f"Slack request failed: {e}")
        return False


# =============================================================================
# NOTIFICACIONES ESPECÍFICAS
# =============================================================================

def extract_critical_suggestions() -> list[str]:
    """
    Extrae sugerencias críticas del archivo de sugerencias FAQ.

    Returns:
        Lista de líneas que contienen palabras clave críticas
    """
    if not FAQ_SUGGESTIONS_FILE.exists():
        logger.warning(f"Suggestions file not found: {FAQ_SUGGESTIONS_FILE}")
        return []

    try:
        with open(FAQ_SUGGESTIONS_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()

        critical = [
            line.strip()
            for line in lines
            if any(keyword in line.lower() for keyword in CRITICAL_KEYWORDS)
        ]

        logger.info(f"Found {len(critical)} critical suggestions")
        return critical

    except IOError as e:
        logger.error(f"Error reading suggestions file: {e}")
        return []


def notify_critical_suggestions() -> bool:
    """
    Envía notificación con sugerencias críticas.

    Returns:
        True si se envió correctamente o no hay sugerencias
    """
    suggestions = extract_critical_suggestions()

    if not suggestions:
        print("✅ No hay sugerencias críticas para notificar.")
        logger.info("No critical suggestions to notify")
        return True

    message = "🚨 *Sugerencias críticas detectadas:*\n\n" + "\n".join(f"• {s}" for s in suggestions)

    success = send_slack_message(
        webhook_url=SLACK_PRIVATE_WEBHOOK,
        message=message,
        title="Alertas Críticas AIGestion",
        color="#ef4444",
        emoji=":warning:",
    )

    if success:
        print(f"✅ Notificación enviada al grupo privado de Slack ({len(suggestions)} items)")
    else:
        print("❌ Error al enviar notificación")

    return success


def notify_error(error_message: str, details: str = None) -> bool:
    """
    Envía notificación de error.

    Args:
        error_message: Descripción del error
        details: Detalles adicionales opcionales

    Returns:
        True si se envió correctamente
    """
    message = f"❌ *Error detectado:*\n{error_message}"
    if details:
        message += f"\n\n```{details}```"

    return send_slack_message(
        webhook_url=SLACK_ERROR_WEBHOOK or SLACK_WEBHOOK,
        message=message,
        title="Error en AIGestion",
        color="#dc2626",
        emoji=":x:",
    )


def notify_faq_suggestions(suggestions: list[dict]) -> bool:
    """
    Envía notificación con nuevas sugerencias de FAQ.

    Args:
        suggestions: Lista de sugerencias [{question, category, priority}]

    Returns:
        True si se envió correctamente
    """
    if not suggestions:
        return True

    lines = []
    for s in suggestions[:10]:  # Máximo 10
        priority_emoji = "🔴" if s.get("priority") == "high" else "🟡" if s.get("priority") == "medium" else "🟢"
        lines.append(f"{priority_emoji} *{s.get('category', 'General')}*: {s.get('question', '')}")

    message = "📝 *Nuevas sugerencias de FAQ:*\n\n" + "\n".join(lines)

    if len(suggestions) > 10:
        message += f"\n\n_...y {len(suggestions) - 10} más_"

    return send_slack_message(
        webhook_url=SLACK_WEBHOOK,
        message=message,
        title="Sugerencias FAQ",
        color="#22c55e"
    )


def notify_quality_report(metrics: dict) -> bool:
    """
    Envía reporte de calidad del agente.

    Args:
        metrics: Diccionario con métricas {nps, csat, response_time, etc.}

    Returns:
        True si se envió correctamente
    """
    nps = metrics.get("nps", 0)
    csat = metrics.get("csat", 0)
    response_time = metrics.get("avg_response_time", 0)

    # Determinar estado según métricas
    if nps >= 8 and csat >= 0.85:
        status = "🟢 Excelente"
        color = "#22c55e"
    elif nps >= 6 and csat >= 0.7:
        status = "🟡 Aceptable"
        color = "#eab308"
    else:
        status = "🔴 Requiere atención"
        color = "#ef4444"

    message = f"""*Estado General:* {status}

📊 *Métricas:*
• NPS: {nps:.1f}/10
• CSAT: {csat:.1%}
• Tiempo respuesta: {response_time:.2f}s
• Queries procesadas: {metrics.get('total_queries', 0)}
• Errores: {metrics.get('errors', 0)}
"""

    return send_slack_message(
        webhook_url=SLACK_WEBHOOK,
        message=message,
        title="Reporte de Calidad AIGestion",
        color=color,
        emoji=":chart_with_upwards_trend:",
    )


def validate_slack_credentials() -> dict:
    """
    Valida que las credenciales de Slack estén configuradas.

    Returns:
        Diccionario con estado de cada webhook
    """
    result = {
        "general": bool(SLACK_WEBHOOK),
        "private": bool(SLACK_PRIVATE_WEBHOOK),
        "error": bool(SLACK_ERROR_WEBHOOK),
    }

    configured = sum(result.values())
    total = len(result)

    print(f"\n📋 Estado de webhooks Slack: {configured}/{total} configurados")
    for name, status in result.items():
        emoji = "✅" if status else "❌"
        print(f"   {emoji} {name.upper()}_WEBHOOK")

    return result


# =============================================================================
# MAIN
# =============================================================================

def main():
    """Punto de entrada para ejecución directa."""
    print("\n" + "=" * 50)
    print("  AIGESTION SLACK NOTIFICATIONS")
    print("=" * 50 + "\n")

    validate_slack_credentials()
    print()
    notify_critical_suggestions()


if __name__ == "__main__":
    main()
