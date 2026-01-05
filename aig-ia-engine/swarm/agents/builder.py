from pathlib import Path
from core import AgentType, BaseAgent, Message
from services.llm import LLMService
from models import MessageType


class Builder(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Builder", AgentType.BUILDER, swarm_bus)
        self.llm = LLMService()

    def process_message(self, message: Message):
        # Determine project root and engine root
        engine_root = Path(__file__).resolve().parents[1]
        project_root = engine_root.parent

        if (
            message.sender == AgentType.ARCHITECT
            and message.msg_type == MessageType.BUILD_CODE
        ):
            self.log("generating_code_via_llm")

            plan = message.content
            is_report = "SUMMARY_REPORT" in plan or "SWARM_REPORT" in plan

            if is_report:
                prompt = f"Implement the following plan. Return ONLY markdown for SWARM_REPORT_AI.md.\n\nPlan: {plan}"
                output_file = project_root / "SWARM_REPORT_AI.md"
            else:
                prompt = f"Implement the following refactoring plan. Return ONLY code for the target file.\n\nPlan: {plan}"
                output_file = engine_root / "swarm" / "REF_TARGET.py"

            try:
                content = self.llm.generate_text(prompt)
                if not content:
                    content = "# Error\nLLM Generation failed."
            except Exception as e:
                self.log("llm_generation_failed", error=str(e))
                content = "# Error\nLLM Generation exception."

            # Clean markdown formatting
            content = (
                content.replace("```markdown", "")
                .replace("```python", "")
                .replace("```", "")
            )

            change_proposal = {
                "file": str(output_file),
                "content": content,
                "type": "REPORT" if is_report else "REFACTOR",
            }

            self.send_message(
                AgentType.CRITIC, change_proposal, MessageType.REVIEW_CODE
            )

        elif message.sender == AgentType.CRITIC and message.msg_type == "REJECTED_CODE":
            self.log("code_rejected_attempting_fix", score=message.content.get("score"))
            rejection = message.content

            prompt = f"Previous code failed quality checks.\nErrors:\n{rejection.get('errors')}\n\nRefactor and fix. Return ONLY the code."
            output_file = engine_root / "swarm" / "REF_TARGET_FIXED.py"

            try:
                content = self.llm.generate_text(prompt)
                if not content:
                    content = "# Fix failed"
            except Exception as e:
                self.log("llm_fix_failed", error=str(e))
                content = "# Fix exception"

            change_proposal = {
                "file": str(output_file),
                "content": content,
                "type": "REFACTOR_RETRY",
            }
            self.send_message(
                AgentType.CRITIC, change_proposal, MessageType.REVIEW_CODE
            )
