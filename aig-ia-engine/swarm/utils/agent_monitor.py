import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

class AgentMonitor:
    """
    Tracks performance metrics for Swarm agents.
    """
    def __init__(self):
        self.metrics_file = Path(__file__).resolve().parents[1] / "agent_metrics.json"
        self._ensure_metrics_file()

    def _ensure_metrics_file(self):
        if not self.metrics_file.exists():
            with open(self.metrics_file, "w") as f:
                json.dump({"agents": {}, "last_updated": datetime.now().isoformat()}, f)

    def record_metrics(self, agent_name: str, duration: float, success: bool, tokens: int = 0):
        """Records a single interaction's metrics."""
        try:
            with open(self.metrics_file, "r") as f:
                data = json.load(f)

            if agent_name not in data["agents"]:
                data["agents"][agent_name] = {
                    "total_calls": 0,
                    "success_rate": 0.0,
                    "avg_duration": 0.0,
                    "total_tokens": 0
                }

            stats = data["agents"][agent_name]
            total = stats["total_calls"]

            # Update Moving Average for Duration
            stats["avg_duration"] = (stats["avg_duration"] * total + duration) / (total + 1)

            # Update Success Rate
            success_val = 1 if success else 0
            stats["success_rate"] = (stats["success_rate"] * total + success_val) / (total + 1)

            stats["total_calls"] += 1
            stats["total_tokens"] += tokens
            data["last_updated"] = datetime.now().isoformat()

            with open(self.metrics_file, "w") as f:
                json.dump(data, f, indent=2)

        except Exception:
            pass # Silent fail for instrumentation

    def get_stats(self) -> Dict[str, Any]:
        """Returns all tracked stats."""
        try:
            with open(self.metrics_file, "r") as f:
                return json.load(f)
        except:
            return {"agents": {}}
