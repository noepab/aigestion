from core import AgentType, BaseAgent, Message
from models import MessageType, ScanReport, SwarmMessageContent
import json
from pathlib import Path


class Overlord(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Overlord", AgentType.OVERLORD, swarm_bus)
        self.learning_registry = (
            Path(__file__).resolve().parent.parent / "lessons_learned.json"
        )

    def start_mission(self):
        self.log("initiating_global_scan")
        self.send_message(
            AgentType.DETECTIVE, "Full System Scan", MessageType.TASK_START
        )

    def process_message(self, message: Message):
        # 1. Handle Learning from Mechanic
        if (
            message.msg_type == MessageType.TASK_COMPLETE
            and message.sender == AgentType.MECHANIC
        ):
            self._ingest_learning(message.content)
            self.log("mission_cycle_completed_successfully")
            return

        # 2. Handle Reports from Detective
        if isinstance(message.content, ScanReport) or (
            isinstance(message.content, dict) and "issues" in message.content
        ):
            report = message.content
            issues = (
                report.get("issues", []) if isinstance(report, dict) else report.issues
            )

            self.log("processing_scan_report", issue_count=len(issues))

            if not issues:
                self.log("no_issues_found_idling")
                return

            # Prioritize: Critical issues first
            # Assuming issues are dicts or objects with severity
            sorted_issues = sorted(
                issues,
                key=lambda x: (
                    x.get("severity")
                    if isinstance(x, dict)
                    else getattr(x, "severity", "LOW")
                )
                == "CRITICAL",
                reverse=True,
            )

            top_issue = sorted_issues[0]
            desc = (
                top_issue.get("description")
                if isinstance(top_issue, dict)
                else getattr(top_issue, "description", "Unknown")
            )

            self.log("dispatching_priority_mission", issue=desc)
            self.send_message(AgentType.ARCHITECT, top_issue, MessageType.REVIEW_CODE)

    def _ingest_learning(self, post_mortem_data: dict):
        """Persists lessons learned to improve future Architect plans."""
        try:
            history = []
            if self.learning_registry.exists():
                with open(self.learning_registry, "r") as f:
                    data = json.load(f)
                    history = data.get("lessons", [])

            history.append(
                {
                    "timestamp": post_mortem_data.get("timestamp"),
                    "file": post_mortem_data.get("file"),
                    "learned": post_mortem_data.get(
                        "summary", "Optimization applied successfully"
                    ),
                }
            )

            with open(self.learning_registry, "w") as f:
                json.dump({"lessons": history[-50:]}, f, indent=2)

            self.log("lessons_learned_ingested", count=len(history))
        except Exception as e:
            self.log("learning_ingestion_failed", error=str(e))
