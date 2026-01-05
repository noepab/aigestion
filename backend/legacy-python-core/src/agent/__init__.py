"""
Agent Module - Núcleo del agente conversacional AIGestion
====================================================

Contiene:
- core: Lógica principal del agente (quick_start_pro, get_weather)
- config: Configuraciones y constantes del agente

Uso:
    from src.agent import core
    asyncio.run(core.quick_start_pro())
"""

from src.agent import core

__all__ = ["core"]
