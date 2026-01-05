"""
Help Module - Sistema de ayuda AIGestion
==================================

Contiene:
- bot: Bot de ayuda interactivo por línea de comandos
- web: Servidor web Flask para ayuda online

Uso:
    # Bot CLI
    from src.help import bot
    bot.run()

    # Web server
    from src.help import web
    web.app.run(port=8080)
"""

from src.help import bot, web

__all__ = ["bot", "web"]
