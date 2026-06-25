from typing import TypedDict

from langchain_core.messages import BaseMessage

from src.agents.answer_agent.datatypes import CitationPayload
from src.agents.guardrails.datatypes import GuardrailsDecision


class ChatGraphState(TypedDict):
    messages: list[BaseMessage]
    latest_user_message: str
    guardrails_decision: GuardrailsDecision | None
    answer_text: str | None
    citations: list[CitationPayload]
