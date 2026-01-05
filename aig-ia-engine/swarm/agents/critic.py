import os
import re
import subprocess
import tempfile
from core import AgentType, BaseAgent, Message
from services.notification import NotificationService
from models import MessageType


class Critic(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Critic", AgentType.CRITIC, swarm_bus)
        self.notifier = NotificationService()

    def process_message(self, message: Message):
        if (
            message.sender == AgentType.BUILDER
            and message.msg_type == MessageType.REVIEW_CODE
        ):
            self.log("reviewing_code_proposal")
            proposal = message.content

            if proposal.get("type") == "REPORT":
                self.log("report_detected_approving")
                self.send_message(
                    AgentType.MECHANIC, proposal, MessageType.TASK_COMPLETE
                )  # Placeholder for deploy
                return

            # Active Code -> Static Analysis
            score, errors = self.run_static_analysis(proposal["content"])

            if score >= 8.0:
                self.log("code_quality_passed", score=score)
                try:
                    self.notifier.notify(
                        "Swarm Quality Gate",
                        f"✅ Code Approved (Score: {score}) for {os.path.basename(proposal['file'])}",
                    )
                except:
                    pass

                proposal["quality_score"] = score
                proposal["lint_report"] = "Clean" if not errors else str(errors[:200])

                self.send_message(
                    AgentType.MECHANIC, proposal, MessageType.TASK_COMPLETE
                )  # Placeholder for deploy
            else:
                self.log("code_quality_failed", score=score)
                try:
                    self.notifier.notify(
                        "Swarm Quality Gate",
                        f"❌ Code Rejected (Score: {score})",
                        "ERROR",
                    )
                except:
                    pass

                rejection_msg = {
                    "reason": "Linting Failed",
                    "score": score,
                    "errors": errors,
                }
                self.send_message(AgentType.BUILDER, rejection_msg, "REJECTED_CODE")

    def run_static_analysis(self, code_content: str):
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            ) as tmp:
                tmp.write(code_content)
                tmp_path = tmp.name

            # Run Pylint (ensure it is installed or fail gracefully)
            try:
                result = subprocess.run(
                    ["pylint", tmp_path, "--disable=C0111,C0103", "--score=y"],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
                output = result.stdout
                match = re.search(r"rated at (-?\d+\.?\d*)/10", output)
                score = float(match.group(1)) if match else 0.0
            except Exception as e:
                self.log("pylint_execution_failed", error=str(e))
                score = 5.0  # Neutral fallback
                output = "Pylint not found or failed."

            os.remove(tmp_path)
            return score, output
        except Exception as e:
            self.log("static_analysis_exception", error=str(e))
            return 0.0, str(e)
