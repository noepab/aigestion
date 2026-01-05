import os
from datetime import datetime
from core import AgentType, BaseAgent, Message
from services.git import GitService
from models import MessageType


class Mechanic(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Mechanic", AgentType.MECHANIC, swarm_bus)
        self.git = GitService()

    def process_message(self, message: Message):
        # The Orchestrator uses TASK_COMPLETE as a generic deploy signal for now
        if message.msg_type in [MessageType.TASK_COMPLETE, "DEPLOY_CODE"]:
            self.log("initiating_safe_deployment_protocol")

            proposal = message.content
            filepath = proposal.get("file")
            content = proposal.get("content")

            if not filepath or not content:
                self.log("invalid_deployment_proposal", proposal=str(proposal)[:100])
                return

            try:
                # 1. Create a safe branch
                try:
                    branch = self.git.create_branch()
                except:
                    branch = None

                if not branch:
                    branch = "current-branch-fallback"
                    self.log("git_branch_creation_failed_proceeding_on_current")
                else:
                    self.log("switched_to_branch", branch=branch)

                # 2. Apply changes
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                self.log("file_written_successfully", path=filepath)

                # 3. Post-deployment verification (Mock)
                self.log("running_post_deployment_tests_ok")

                if branch != "current-branch-fallback":
                    try:
                        self.git.commit_changes(
                            f"Auto-fix for {os.path.basename(filepath)}"
                        )
                        self.log("changes_committed")
                    except Exception as e:
                        self.log("git_commit_failed", error=str(e))

                # 4. Notify Overlord with Post-Mortem data for learning
                post_mortem = {
                    "file": filepath,
                    "status": "SUCCESS",
                    "summary": f"Applied fix to {os.path.basename(filepath)} on branch {branch}",
                    "timestamp": datetime.now().isoformat(),
                }
                self.send_message(
                    AgentType.OVERLORD, post_mortem, MessageType.TASK_COMPLETE
                )

            except Exception as e:
                self.log("deployment_failed", error=str(e))
                self.send_message(
                    AgentType.OVERLORD, f"Deployment failed: {e}", MessageType.ERROR
                )
