from core import AgentType, BaseAgent, Message
from services.llm import LLMService
from services.memory import MemoryService
from services.rag_v2 import HybridRetriever
from models import MessageType


class Architect(BaseAgent):
    def __init__(self, swarm_bus):
        super().__init__("Architect", AgentType.ARCHITECT, swarm_bus)
        self.llm = LLMService()
        self.memory = MemoryService()
        self.retriever = HybridRetriever()

    def process_message(self, message: Message):
        if message.msg_type == MessageType.REVIEW_CODE:
            issue = message.content
            # Convert issue to string for retrieval/prompting
            if isinstance(issue, dict):
                issue_text = issue.get("description", str(issue))
            else:
                issue_text = str(issue)

            self.log("designing_solution", issue=issue_text[:100])

            # 1. Retrieve Context using Hybrid RAG (Phase 5)
            try:
                context_results = self.retriever.retrieve(issue_text)
                context_str = "\n".join([r["text"] for r in context_results])
                self.log("recalled_context", count=len(context_results))
            except Exception as e:
                self.log("context_retrieval_failed", error=str(e))
                context_str = ""

            # 2. Generate Plan
            try:
                plan = self.llm.generate_solution(
                    f"Issue: {issue_text}\nContext: {context_str}"
                )
            except Exception as e:
                self.log("llm_generation_failed", error=str(e))
                plan = None

            if not plan or "Error" in plan:
                self.log("design_failed", error=plan)
                return

            self.send_message(AgentType.BUILDER, plan, MessageType.DESIGN_SPEC)
