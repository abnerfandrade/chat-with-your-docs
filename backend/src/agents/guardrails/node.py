from __future__ import annotations

from typing import Any, TYPE_CHECKING

from langchain_core.messages import HumanMessage, SystemMessage
from loguru import logger

from src.agents.guardrails.datatypes import GuardrailsDecision
from src.agents.guardrails.prompt import SYSTEM_PROMPT
from src.agents.llm import get_llm

if TYPE_CHECKING:
    from src.agents.state import ChatGraphState


def _extract_latest_user_message(state: ChatGraphState) -> str:
    latest_user_message = state.get("latest_user_message")
    if isinstance(latest_user_message, str) and latest_user_message.strip():
        return latest_user_message

    messages = state.get("messages") or []
    for message in reversed(messages):
        content = getattr(message, "content", None)
        if isinstance(message, HumanMessage) and isinstance(content, str) and content.strip():
            return content

    raise ValueError("No latest user message was provided to guardrails_node")


async def guardrails_node(state: ChatGraphState) -> dict[str, GuardrailsDecision]:
    user_message = _extract_latest_user_message(state)
    log = logger.bind(service="guardrails_node")
    log.debug(f"Evaluating latest user message in guardrails | chars={len(user_message)}")

    model = get_llm().with_structured_output(GuardrailsDecision)
    decision = await model.ainvoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]
    )
    log.info(f"Guardrails verdict: {decision.verdict}")

    return {"guardrails_decision": decision}
