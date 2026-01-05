import os
from pathlib import Path
from datetime import datetime
from core import AgentType, BaseAgent, Message
from services.llm import LLMService
from models import ScanIssue, ScanReport, MessageType


class Detective(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Detective", AgentType.DETECTIVE, swarm_bus)
        self.llm = LLMService()

    def process_message(self, message: Message):
        if message.msg_type == MessageType.START_SCAN:
            self.log("starting_intelligent_scan")
            report = self.scan_codebase()

            if report.total_issues > 0:
                self.log("scan_completed_with_issues", count=report.total_issues)
                self.send_message(AgentType.OVERLORD, report, MessageType.SCAN_RESULT)
            else:
                self.log("scan_completed_no_issues")
                self.send_message(
                    AgentType.OVERLORD,
                    "No significant issues found.",
                    MessageType.SCAN_RESULT,
                )

    def scan_codebase(self) -> ScanReport:
        # Resolve project root (parent of 'aig-ia-engine')
        # Assuming current file is in 'aig-ia-engine/swarm/agents/detective.py'
        project_root = Path(__file__).resolve().parents[3]

        self.log("scanning_codebase", root=str(project_root))

        issues = []
        for root, dirs, files in os.walk(project_root):
            # Exclusion list
            if any(
                part in root
                for part in [
                    "node_modules",
                    ".git",
                    "dist",
                    ".gemini",
                    "venv",
                    "__pycache__",
                ]
            ):
                continue

            for file in files:
                filepath = os.path.join(root, file)
                try:
                    # Check file size
                    size = os.path.getsize(filepath)
                    if size > 500 * 1024:
                        issues.append(
                            ScanIssue(
                                category="SIZE",
                                path=str(filepath),
                                description=f"File is too large ({size/1024:.2f} KB).",
                                severity="WARNING",
                            )
                        )

                    # LLM Analysis candidate
                    if file.endswith(".py") and "test" not in file:
                        issues.append(
                            ScanIssue(
                                category="AI_CANDIDATE",
                                path=str(filepath),
                                description="Ready for AI heuristic review.",
                                severity="INFO",
                            )
                        )

                except Exception as e:
                    self.log("file_scan_error", path=filepath, error=str(e))

        return ScanReport(
            total_issues=len(issues),
            issues=issues,
            timestamp=datetime.now().isoformat(),
        )
