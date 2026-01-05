"""
Core Agent Module - Lógica principal del agente AIGestion
====================================================

Este módulo contiene la implementación del agente conversacional AIGestion
con soporte para:
- Consultas de clima (OpenWeatherMap API)
- Sistema de roles y permisos
- Historial de contexto conversacional
- Feedback y métricas de satisfacción (NPS/CSAT)
- Reglas de negocio validables
- Soporte multiidioma (ES, EN, FR)
- Tono configurable (formal/informal)

Dependencias:
- agent_framework
- openai
- aiofiles
- requests
- dotenv

Uso:
    import asyncio
    from src.agent.core import quick_start_pro
    asyncio.run(quick_start_pro())

Configuración via ENV:
- GITHUB_TOKEN: Token para acceso a modelos
- OPENWEATHER_API_KEY: API key de OpenWeatherMap
- AIGESTION_ROLE: Rol del usuario (admin, user, guest)
- AIGESTION_LANG: Idioma (es, en, fr)
- AIGESTION_USER_TONE: Tono de respuestas (formal, informal)
"""

import asyncio
import json
import logging
import os
import re
from random import randint
from typing import Annotated

import aiofiles
import requests
from agent_framework import ChatAgent
from agent_framework.observability import setup_observability
from agent_framework.openai import OpenAIChatClient
from dotenv import load_dotenv
from openai import AsyncOpenAI

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

load_dotenv()

# Configurar logging
logging.basicConfig(
    filename="logs/agent.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("AIGestion.Agent")

# OpenTelemetry tracing
setup_observability(
    otlp_endpoint=os.getenv("OTLP_ENDPOINT", "http://localhost:4317"),
    enable_sensitive_data=os.getenv("OTEL_SENSITIVE_DATA", "true").lower() == "true",
)

# =============================================================================
# CONSTANTES
# =============================================================================

DEFAULT_MODEL = "openai/gpt-4.1-mini"
API_BASE_URL = "https://models.github.ai/inference"

FILES = {
    "roles": "data/roles.json",
    "context": "data/aigestion_context.json",
    "rules": "data/aigestion_rules.json",
    "feedback": "data/aigestion-feedback.json",
    "satisfaction": "data/aigestion_satisfaction.json",
    "queries": "evaluation/queries.json",
    "responses": "evaluation/responses.json",
}

INSTRUCTIONS = {
    "es": {
        "formal": (
            "Eres un agente útil para el proyecto AIGestion. Responde de forma formal, "
            "directa y relevante, evitando frases genéricas o redundantes. "
            "Si usas la herramienta de clima, responde solo con la información "
            "solicitada, sin agregar preguntas adicionales."
        ),
        "informal": (
            "Eres un agente útil para el proyecto AIGestion. Responde de forma cercana "
            "e informal, usando lenguaje sencillo y amigable. "
            "Si usas la herramienta de clima, responde solo con la información "
            "solicitada, sin agregar preguntas adicionales."
        ),
    },
    "en": {
        "formal": (
            "You are a helpful agent for the AIGestion project. Respond formally, "
            "directly and relevantly, avoiding generic or redundant phrases. "
            "If you use the weather tool, respond only with the requested "
            "information, without adding extra questions."
        ),
        "informal": (
            "You are a helpful agent for the AIGestion project. Respond in a friendly "
            "and informal way, using simple and approachable language. "
            "If you use the weather tool, respond only with the requested "
            "information, without adding extra questions."
        ),
    },
    "fr": {
        "formal": (
            "Vous êtes un agent utile pour le projet AIGestion. Répondez de manière "
            "formelle, directe et pertinente, en évitant les phrases génériques "
            "ou redondantes. Si vous utilisez l'outil météo, répondez uniquement "
            "avec l'information demandée, sans ajouter de questions supplémentaires."
        ),
        "informal": (
            "Vous êtes un agent utile pour le projet AIGestion. Répondez de manière "
            "informelle et amicale, avec un langage simple et accessible. "
            "Si vous utilisez l'outil météo, répondez uniquement avec l'information "
            "demandée, sans ajouter de questions supplémentaires."
        ),
    },
}

WEATHER_CONDITIONS = ["soleado", "nublado", "lluvioso", "tormentoso"]


# =============================================================================
# HERRAMIENTAS
# =============================================================================

def get_weather(
    location: Annotated[str, "Ubicación para consultar el clima."],
) -> str:
    """
    Obtiene el clima actual para una ubicación dada.

    Usa la API de OpenWeatherMap si está configurada, de lo contrario
    genera datos simulados.

    Args:
        location: Nombre de la ciudad o ubicación

    Returns:
        String con descripción del clima y temperatura máxima
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")

    if api_key:
        try:
            url = (
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?q={location}&appid={api_key}&units=metric&lang=es"
            )
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            desc = data["weather"][0]["description"]
            temp = int(data["main"]["temp_max"])
            logger.info(f"Weather API success for {location}: {desc}, {temp}°C")
            return f"{location}: {desc}, máxima {temp}°C (datos reales)."
        except requests.RequestException as e:
            logger.error(f"Weather API error for {location}: {e}")
    else:
        logger.warning("OPENWEATHER_API_KEY not set, using simulated data")

    # Datos simulados
    condition = WEATHER_CONDITIONS[randint(0, 3)]
    temp = randint(10, 30)
    return f"{location}: {condition}, máxima {temp}°C."


# =============================================================================
# HELPERS
# =============================================================================

async def load_json_file(filepath: str, default=None):
    """Carga un archivo JSON de forma asíncrona con manejo de errores."""
    if default is None:
        default = []
    try:
        async with aiofiles.open(filepath, "r", encoding="utf-8") as f:
            return json.loads(await f.read())
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}")
        return default
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in {filepath}: {e}")
        return default


async def save_json_file(filepath: str, data) -> bool:
    """Guarda datos a un archivo JSON de forma asíncrona."""
    try:
        async with aiofiles.open(filepath, "w", encoding="utf-8") as f:
            await f.write(json.dumps(data, ensure_ascii=False, indent=2))
        return True
    except IOError as e:
        logger.error(f"Error saving to {filepath}: {e}")
        return False


def validate_weather_response(response: str, rules: dict) -> bool:
    """Valida que una respuesta de clima cumpla las reglas de negocio."""
    clima_rules = rules.get("clima", {})
    valid_conditions = clima_rules.get("valid_conditions", [])
    temp_range = clima_rules.get("max_temp_range", [10, 40])

    # Verificar condición válida
    if valid_conditions and not any(c in response.lower() for c in valid_conditions):
        return False

    # Verificar rango de temperatura
    temp_match = re.search(r"(\d{1,2})°C", response)
    if temp_match:
        temp = int(temp_match.group(1))
        if not (temp_range[0] <= temp <= temp_range[1]):
            return False

    return True


def get_instructions(lang: str, tone: str) -> str:
    """Obtiene las instrucciones del agente según idioma y tono."""
    return INSTRUCTIONS.get(lang, INSTRUCTIONS["es"]).get(tone, INSTRUCTIONS["es"]["formal"])


# =============================================================================
# CACHE
# =============================================================================

class AgentCache:
    """Cache en memoria para datos del agente."""

    def __init__(self):
        self.feedback: list = None
        self.context: list = None
        self.satisfaction: list = None
        self.roles: dict = None
        self.rules: dict = None

    def reset(self):
        """Reinicia toda la cache."""
        self.__init__()


_cache = AgentCache()


# =============================================================================
# MAIN
# =============================================================================

async def quick_start_pro() -> None:
    """
    Punto de entrada principal del agente AIGestion.

    Ejecuta todas las queries definidas en evaluation/queries.json,
    procesa respuestas con el modelo configurado, y recopila
    feedback y métricas de satisfacción.
    """
    global _cache

    # Cargar configuraciones
    if _cache.roles is None:
        _cache.roles = await load_json_file(FILES["roles"], {})
    if _cache.rules is None:
        _cache.rules = await load_json_file(FILES["rules"], {})
    if _cache.feedback is None:
        _cache.feedback = await load_json_file(FILES["feedback"], [])
    if _cache.context is None:
        _cache.context = await load_json_file(FILES["context"], [])
    if _cache.satisfaction is None:
        _cache.satisfaction = await load_json_file(FILES["satisfaction"], [])

    # Verificar permisos de rol
    user_role = os.getenv("AIGESTION_ROLE", "user")
    allowed_actions = _cache.roles.get(user_role, [])

    logger.info(f"Agent started with role: {user_role}")

    # Configurar cliente
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        logger.error("GITHUB_TOKEN not set")
        print("Error: GITHUB_TOKEN no está configurado")
        return

    openai_client = AsyncOpenAI(
        base_url=API_BASE_URL,
        api_key=github_token,
    )
    chat_client = OpenAIChatClient(
        async_client=openai_client,
        model_id=os.getenv("AIGESTION_MODEL", DEFAULT_MODEL),
    )

    # Obtener instrucciones según configuración
    lang = os.getenv("AIGESTION_LANG", "es")
    tone = os.getenv("AIGESTION_USER_TONE", "formal")
    instructions = get_instructions(lang, tone)

    # Crear agente
    agent = ChatAgent(
        chat_client=chat_client,
        name="AgenteAIGestion",
        instructions=instructions,
        tools=[get_weather],
    )

    # Cargar queries
    queries = await load_json_file(FILES["queries"], [])
    responses = []

    for item in queries:
        # Verificar permisos
        if "query" not in allowed_actions:
            print(f"Permiso denegado para queries (rol: {user_role})")
            logger.warning(f"Query permission denied for role: {user_role}")
            continue

        query = item.get("query", "")
        thread = agent.get_new_thread()

        # Añadir feedback previo relevante
        relevant_feedback = [fb for fb in _cache.feedback if fb.get("query") == query]
        if relevant_feedback:
            agent.instructions += "\nSugerencias previas: " + ", ".join(
                fb["suggestion"] for fb in relevant_feedback
            )

        # Añadir contexto conversacional previo
        previous_context = [c for c in _cache.context if c.get("query") == query]
        if previous_context:
            agent.instructions += "\nContexto previo: " + ", ".join(
                c["response"] for c in previous_context
            )

        try:
            # Detectar query ambigua
            is_ambiguous = len(query.strip()) < 10 or any(
                w in query.lower() for w in ["?", "ayuda", "info", "más", "detalle"]
            )

            # Ejecutar query
            result = ""
            async for chunk in agent.run_stream(query, thread=thread):
                if chunk.text:
                    result += chunk.text

            # Validar respuesta de clima
            if "clima" in query.lower():
                if not validate_weather_response(result, _cache.rules):
                    logger.warning(f"Response out of rules: {result}")
                    print(f"⚠️ Advertencia: respuesta fuera de reglas -> {result}")

            # Construir respuesta completa
            explanation = "(Esta respuesta se genera usando el modelo seleccionado y las reglas de negocio definidas para el dominio AIGestion.)"
            suggestion = (
                "¿Te gustaría saber el pronóstico para otra ciudad o día?"
                if "clima" in query.lower()
                else "¿Necesitas información adicional sobre AIGestion?"
            )

            full_response = f"{result}\n{explanation}\n{suggestion}"
            if is_ambiguous:
                full_response += "\n(Parece que tu pregunta es ambigua o incompleta. ¿Puedes dar más detalles?)"

            responses.append({"query": query, "response": full_response})
            _cache.context.append({"query": query, "response": full_response})
            await save_json_file(FILES["context"], _cache.context)

            logger.info(f"Query processed: {query[:50]}...")
            print(f"Query: {query}\nResponse: {full_response}\n")

        except Exception as e:
            logger.error(f"Error processing query '{query}': {e}")
            print(f"Error en query '{query}': {e}")
            continue

        # Recopilar feedback
        user_correction = input("¿Quieres corregir la respuesta? (deja vacío si no): ")
        if user_correction:
            _cache.feedback.append({"query": query, "suggestion": user_correction})
            await save_json_file(FILES["feedback"], _cache.feedback)
            logger.info(f"Feedback registered for query: {query[:30]}...")

        # Métrica de satisfacción
        satisfaction = input("¿Cómo calificarías la respuesta? (1-10 NPS, o 'ok'/'nok' CSAT): ")
        _cache.satisfaction.append({"query": query, "response": result, "score": satisfaction})
        await save_json_file(FILES["satisfaction"], _cache.satisfaction)
        logger.info(f"Satisfaction registered: {satisfaction} for query: {query[:30]}...")

    # Guardar respuestas
    with open(FILES["responses"], "w", encoding="utf-8") as f:
        json.dump(responses, f, ensure_ascii=False, indent=2)

    logger.info(f"Agent completed. Processed {len(responses)} queries.")


def run_help_bot():
    """Ejecuta el bot de ayuda interactivo."""
    import subprocess
    subprocess.run(["python", "-m", "src.help.bot"])


def main():
    """Punto de entrada principal con menú."""
    print("\n" + "=" * 50)
    print("  BIENVENIDO AL SISTEMA AIGESTION AGENT")
    print("=" * 50)
    print("\n1. Ejecutar agente principal")
    print("2. Canal de ayuda automatizado")
    print("3. Salir")
    print()

    opcion = input("Selecciona una opción (1/2/3): ").strip()

    if opcion == "1":
        asyncio.run(quick_start_pro())
    elif opcion == "2":
        run_help_bot()
    else:
        print("¡Hasta pronto!")


if __name__ == "__main__":
    main()
