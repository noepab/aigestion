"""
Help Bot - Bot de ayuda interactivo AIGestion
=======================================

Bot de línea de comandos que responde preguntas usando el archivo FAQ.

Características:
- Búsqueda en AIGestion_FAQ.md
- Sugerencias aleatorias cuando no encuentra respuesta
- Logging de consultas
- Soporte para comandos de salida

Uso:
    python -m src.help.bot

Comandos:
    salir, exit, quit - Terminar sesión
"""

import logging
import random
from pathlib import Path

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

# Paths relativos al proyecto
PROJECT_ROOT = Path(__file__).parent.parent.parent
FAQ_FILE = PROJECT_ROOT / "docs" / "AIG_FAQ.md"
LOG_FILE = PROJECT_ROOT / "logs" / "help_bot.log"
SUPPORT_EMAIL = "soporte@aigestion.net"

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [HelpBot] %(message)s",
)
logger = logging.getLogger("AIGestion.HelpBot")

# Tips de ayuda
TIPS = [
    "Revisa la guía rápida en docs/AIGestion_GUIA_RAPIDA.md.",
    "Asegúrate de tener permisos adecuados en data/roles.json.",
    "Verifica tu conexión a internet si usas APIs externas.",
    "Consulta los logs en logs/agent.log para más detalles.",
    "Usa 'python -m src.agent.core' para ejecutar el agente principal.",
    "Configura tus variables de entorno en el archivo .env",
]

EXIT_COMMANDS = ["salir", "exit", "quit", "q"]


# =============================================================================
# FUNCIONES
# =============================================================================

def load_faq() -> str:
    """Carga el contenido del archivo FAQ."""
    try:
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.error(f"FAQ file not found: {FAQ_FILE}")
        return ""


def search_faq(query: str, faq_content: str) -> str | None:
    """
    Busca una respuesta en el FAQ.

    Args:
        query: Texto de búsqueda (lowercase)
        faq_content: Contenido del archivo FAQ

    Returns:
        Línea que contiene la query, o None si no encuentra
    """
    if not query:
        return None

    for line in faq_content.splitlines():
        if query in line.lower():
            return line

    return None


def get_random_tip() -> str:
    """Obtiene una sugerencia aleatoria."""
    return random.choice(TIPS)


def run():
    """Ejecuta el bot de ayuda interactivo."""
    print("\n" + "=" * 60)
    print("  CANAL DE AYUDA AIGESTION AGENT")
    print("=" * 60)
    print(f"\nEscribe tu pregunta o '{EXIT_COMMANDS[0]}' para terminar.\n")

    faq = load_faq()
    if not faq:
        print("⚠️ Advertencia: No se pudo cargar el archivo FAQ.")
        print(f"   Asegúrate de que existe: {FAQ_FILE}\n")

    while True:
        try:
            user_input = input("Pregunta: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n¡Hasta pronto!")
            break

        # Verificar comando de salida
        if user_input.lower() in EXIT_COMMANDS:
            print("Gracias por usar el canal de ayuda. ¡Hasta pronto!")
            logger.info("User session ended")
            break

        # Registro de consulta
        logger.info(f"Query: {user_input}")

        # Buscar respuesta
        answer = search_faq(user_input.lower(), faq)

        if answer:
            print(f"✅ Respuesta: {answer}\n")
            logger.info(f"Answer found for: {user_input[:30]}...")
        else:
            print("❌ No encontré una respuesta directa.")
            print(f"   Puedes consultar la documentación o escribir a {SUPPORT_EMAIL}")
            print(f"   💡 Tip: {get_random_tip()}\n")
            logger.info(f"No answer found for: {user_input[:30]}...")


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    run()
