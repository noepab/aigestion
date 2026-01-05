from agents.architect import Architect
from agents.builder import Builder
from agents.critic import Critic
from agents.detective import Detective
from agents.mechanic import Mechanic
from agents.overlord import Overlord
from core import SwarmOrchestrator
from utils import configure_swarm_logging


def main():
    # Initialize structured logging
    configure_swarm_logging()

    print("Initializing AIGestion Swarm (The Hexagon)...")
    orchestrator = SwarmOrchestrator()

    # Instantiate Agents
    overlord = Overlord(orchestrator)
    detective = Detective(orchestrator)
    architect = Architect(orchestrator)
    builder = Builder(orchestrator)
    critic = Critic(orchestrator)
    mechanic = Mechanic(orchestrator)

    # Register Agents
    orchestrator.register_agent(overlord)
    orchestrator.register_agent(detective)
    orchestrator.register_agent(architect)
    orchestrator.register_agent(builder)
    orchestrator.register_agent(critic)
    orchestrator.register_agent(mechanic)

    print("Swarm assembled. Handing control to Overlord...")

    # Start the loop
    overlord.start_mission()

    print("Mission cycle completed.")


if __name__ == "__main__":
    main()
