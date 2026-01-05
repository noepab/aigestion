import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Adjust path to import core/utils
sys.path.append(str(Path(__file__).resolve().parent))

from utils.agent_monitor import AgentMonitor

class SwarmCLI:
    def __init__(self):
        self.monitor = AgentMonitor()
        self.state_file = Path(__file__).resolve().parent / "swarm_state.json"

    def show_status(self):
        """Displays agent health and metrics."""
        print("\n=== 🐝 AIGestion Swarm Status ===")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        stats = self.monitor.get_stats()
        agents = stats.get("agents", {})

        if not agents:
            print("No agent activity recorded yet.")
            return

        print(f"{'Agent':<15} | {'Calls':<8} | {'Success':<8} | {'Avg. Latency':<12}")
        print("-" * 55)
        for name, data in agents.items():
            success = f"{data['success_rate']*100:.1f}%"
            latency = f"{data['avg_duration']:.2f}s"
            print(f"{name:<15} | {data['total_calls']:<8} | {success:<8} | {latency:<12}")
        print("-" * 55)

    def tail_logs(self, limit=10):
        """Displays recent swarm events."""
        if not self.state_file.exists():
            print("Swarm state file not found.")
            return

        print(f"\n=== 📄 Recent Swarm Events (Last {limit}) ===")
        with open(self.state_file, "r") as f:
            data = json.load(f)
            history = data.get("history", [])[-limit:]

        for event in history:
            ts = event['timestamp'].split('T')[1][:8]
            print(f"[{ts}] {event['sender']} -> {event['receiver']} ({event['type']})")
            content = event['content']
            if len(content) > 80:
                print(f"      {content[:77]}...")
            else:
                print(f"      {content}")

def main():
    parser = argparse.ArgumentParser(description="AIGestion Swarm CLI Controller")
    subparsers = parser.add_subparsers(dest="command")

    # Status Command
    subparsers.add_parser("status", help="Show Swarm status and metrics")

    # Logs Command
    log_parser = subparsers.add_parser("logs", help="Tail recent Swarm events")
    log_parser.add_argument("--limit", type=int, default=10, help="Number of logs to show")

    args = parser.parse_args()
    cli = SwarmCLI()

    if args.command == "status":
        cli.show_status()
    elif args.command == "logs":
        cli.tail_logs(args.limit)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
