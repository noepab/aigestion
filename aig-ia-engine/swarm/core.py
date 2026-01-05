import abc
import os
from enum import Enum
from typing import Any, Dict, List, Union
from utils import get_swarm_logger, persist_swarm_event
from security import SecurityLayer
from models import MessageType

# Initialize structured logger
logger = get_swarm_logger("SwarmCore")


class AgentType(Enum):
    OVERLORD = "Overlord"
    DETECTIVE = "Detective"
    ARCHITECT = "Architect"
    BUILDER = "Builder"
    CRITIC = "Critic"
    MECHANIC = "Mechanic"


class Message:
    def __init__(
        self,
        sender: AgentType,
        receiver: AgentType,
        content: Any,
        msg_type: Union[str, MessageType] = "INFO",
    ):
        self.sender = sender
        self.receiver = receiver
        self.content = content
        self.msg_type = msg_type if isinstance(msg_type, str) else msg_type.value

    def __repr__(self):
        return f"Message({self.sender.value} -> {self.receiver.value}: {self.msg_type})"


import time
from utils.agent_monitor import AgentMonitor

# Global monitor instance
agent_monitor = AgentMonitor()


class BaseAgent(abc.ABC):
    def __init__(self, name: str, agent_type: AgentType, swarm_bus):
        self.name = name
        self.agent_type = agent_type
        self.swarm_bus = swarm_bus
        self.logger = get_swarm_logger(f"Agent-{name}")

    def dispatch_processing(self, message: Message):
        """Wrapper to measure performance."""
        start_time = time.time()
        success = False
        try:
            self.process_message(message)
            success = True
        except Exception as e:
            self.log("message_processing_failed", error=str(e))
            raise e
        finally:
            duration = time.time() - start_time
            agent_monitor.record_metrics(self.name, duration, success)

    @abc.abstractmethod
    def process_message(self, message: Message):
        """Handle incoming messages from the swarm."""
        pass

    def send_message(
        self,
        receiver: AgentType,
        content: Any,
        msg_type: Union[str, MessageType] = "INFO",
    ):
        """Send a message to another agent via the bus."""
        msg = Message(self.agent_type, receiver, content, msg_type)
        self.swarm_bus.dispatch(msg)

    def log(self, message: str, **kwargs):
        """Structured logging for agents."""
        # Sanitize logs
        sanitized_kwargs = {
            k: SecurityLayer.sanitize_content(v) for k, v in kwargs.items()
        }
        self.logger.info(
            SecurityLayer.mask_pii(message),
            agent=self.name,
            type=self.agent_type.value,
            **sanitized_kwargs,
        )


class SwarmOrchestrator:
    def __init__(self):
        self.agents: Dict[AgentType, BaseAgent] = {}
        self.message_queue: List[Message] = []

    def register_agent(self, agent: BaseAgent):
        self.agents[agent.agent_type] = agent
        agent.log(f"Registered as {agent.agent_type.value}")

    def dispatch(self, message: Message):
        # SECURITY CHECK: Adversarial Detection
        if SecurityLayer.is_adversarial(str(message.content)):
            logger.warning(
                "adversarial_content_detected",
                sender=message.sender.value,
                receiver=message.receiver.value,
            )
            # Optional: Block or flag the message. For now, we just log.

        logger.info(
            "dispatching_message",
            sender=message.sender.value,
            receiver=message.receiver.value,
            type=message.msg_type,
        )

        # Persist state using centralized utility (which handles sanitization)
        persist_swarm_event(
            sender=message.sender.value,
            receiver=message.receiver.value,
            msg_type=message.msg_type,
            content=message.content,
        )

        if message.receiver in self.agents:
            try:
                # Use the monitored wrapper
                self.agents[message.receiver].dispatch_processing(message)
            except Exception as e:
                logger.error(
                    f"Error processing message {message} by {message.receiver}: {e}"
                )
        else:
            logger.warning(f"Receiver {message.receiver} not found!")

    def broadcast(self, sender: AgentType, content: Any, msg_type: str = "BROADCAST"):
        logger.info("broadcasting_message", sender=sender.value, type=msg_type)
        for agent_type, agent in self.agents.items():
            if agent_type != sender:
                self.dispatch(Message(sender, agent_type, content, msg_type))
