from __future__ import annotations

from functools import lru_cache
from typing import Any, TYPE_CHECKING

from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from loguru import logger

from src.agents.llm import get_llm
from src.agents.answer_agent.datatypes import AnswerAgentResult
from src.agents.answer_agent.middlewares import build_answer_agent_middlewares
from src.agents.answer_agent.tools import search_documents
from src.agents.answer_agent.prompt import SYSTEM_PROMPT

if TYPE_CHECKING:
    from src.agents.state import ChatGraphState


@lru_cache(maxsize=1)
def get_answer_agent():
    return create_agent(
        model=get_llm(),
        tools=[search_documents],
        middleware=list(build_answer_agent_middlewares()),
        name="answer_agent",
        system_prompt=SYSTEM_PROMPT,
        response_format=AnswerAgentResult,
    )


def _extract_answer_agent_result(result: Any) -> AnswerAgentResult:
    if isinstance(result, AnswerAgentResult):
        return result

    if isinstance(result, dict):
        structured_response = result.get("structured_response")
        if isinstance(structured_response, AnswerAgentResult):
            return structured_response
        if isinstance(structured_response, dict):
            return AnswerAgentResult.model_validate(structured_response)

    raise ValueError("Answer agent did not return a valid structured response")


async def answer_agent_node(state: ChatGraphState) -> dict[str, Any]:
    log = logger.bind(service="answer_agent_node")
    log.debug("Invoking answer agent node")

    agent = get_answer_agent()
    raw_result = await agent.ainvoke({"messages": state.get("messages", [])})
    answer_result = _extract_answer_agent_result(raw_result)

    updates: dict[str, Any] = {
        "answer_text": answer_result.answer_text,
        "citations": answer_result.citations,
    }
    if answer_result.answer_text:
        updates["messages"] = [AIMessage(content=answer_result.answer_text)]

    log.info(
        f"Answer agent completed | citations={len(answer_result.citations)} "
        f"chars={len(answer_result.answer_text)}"
    )
    return updates
