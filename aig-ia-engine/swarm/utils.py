import os
import json
import structlog
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import BaseModel
from security import SecurityLayer


def configure_swarm_logging():
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_swarm_logger(name):
    return structlog.get_logger(name)


def persist_swarm_event(sender: str, receiver: str, msg_type: str, content: Any):
    try:
        # Resolve path relative to this file
        base_path = Path(__file__).resolve().parent
        state_file = base_path / "swarm_state.json"

        # APPLY SECURITY FILTER
        sanitized_content = SecurityLayer.sanitize_content(content)

        history = []
        if state_file.exists():
            with open(state_file, "r") as f:
                try:
                    data = json.load(f)
                    history = data.get("history", [])
                except:
                    pass

        if isinstance(sanitized_content, (dict, list)):
            content_str = json.dumps(sanitized_content)
        else:
            content_str = str(sanitized_content)

        event = {
            "timestamp": datetime.now().isoformat(),
            "sender": sender,
            "receiver": receiver,
            "type": msg_type,
            "content": (
                content_str[:1000] + "..." if len(content_str) > 1000 else content_str
            ),
        }
        history.append(event)
        history = history[-100:]  # Keep last 100 events

        with open(state_file, "w") as f:
            json.dump(
                {"history": history, "last_update": datetime.now().isoformat()},
                f,
                indent=2,
            )
    except Exception as e:
        # Fallback to standard print if logging fails during persistence
        print(f"Failed to persist swarm event: {e}")
