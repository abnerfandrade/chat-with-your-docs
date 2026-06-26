from __future__ import annotations

from functools import lru_cache
from typing import Any, TYPE_CHECKING

from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from langgraph.config import get_stream_writer
from loguru import logger

from src.agents.llm import get_llm
from src.agents.answer_agent.datatypes import AnswerAgentResult
from src.agents.answer_agent.middlewares import build_answer_agent_middlewares
from src.agents.streaming import StructuredFieldStreamExtractor, extract_message_text
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

async def answer_agent_node(state: ChatGraphState) -> dict[str, Any]:
    log = logger.bind(service="answer_agent_node")
    log.debug("Invoking answer agent node")

    agent = get_answer_agent()
    writer = get_stream_writer()
    stream_extractor = StructuredFieldStreamExtractor(
        schema=AnswerAgentResult,
        field_name="answer_text",
    )

    raw_result: dict | None = None
    async for mode, payload in agent.astream(
        {"messages": state.get("messages", [])},
        stream_mode=["messages", "values"],
    ):
        if mode == "messages":
            message_chunk, _ = payload
            text = stream_extractor.feed(extract_message_text(message_chunk))
            if text:
                writer({"event": "content", "text": text})
            continue

        if mode == "values":
            raw_result = payload

    if raw_result is None:
        raise ValueError("Answer agent stream completed without a final state")

    answer_result: AnswerAgentResult = raw_result["structured_response"]

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
