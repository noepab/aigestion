"""

=========================================

Este paquete centraliza todo el código Python del proyecto AIGestion.

Módulos principales:
- agent: Núcleo del agente conversacional
- help: Sistema de ayuda (bot y web)
- notifications: Integraciones con Slack y alertas
- validation: Validadores de formato y semántica
- training: Reentrenamiento y evaluación automática
- utils: Utilidades compartidas

Uso rápido:
    from src import agent, help, notifications, validation, training

Autor: AIGestion Team
"""

__version__ = "2.0.0"
__author__ = "AIGestion Team"

# Lazy imports para evitar dependencias circulares
def get_agent():
    from src.agent import core
    return core

def get_help_bot():
    from src.help import bot
    return bot

def get_help_web():
    from src.help import web
    return web

def get_notifications():
    from src import notifications
    return notifications

def get_validation():
    from src import validation
    return validation

def get_training():
    from src import training
    return training
