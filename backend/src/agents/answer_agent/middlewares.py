from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from langchain.agents.middleware import (
    AgentMiddleware,
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
    ToolRetryMiddleware,
)
from langchain.agents.middleware.types import ToolCallRequest
from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.runtime import Runtime
from langgraph.types import Command
from loguru import logger

from src.core.config import settings


def _preview_text(text: str, *, limit: int = 120) -> str:
    normalized = " ".join(text.split()).strip()
    if len(normalized) <= limit:
        return normalized

    return f"{normalized[: limit - 3].rstrip()}..."


def _extract_latest_user_message(state: dict[str, Any]) -> str:
    messages = state.get("messages", [])
    for message in reversed(messages):
        if isinstance(message, HumanMessage) and isinstance(message.content, str):
            return message.content

    latest_user_message = state.get("latest_user_message")
    if isinstance(latest_user_message, str):
        return latest_user_message

    return ""


def _extract_structured_response_metrics(state: dict[str, Any]) -> tuple[int, int]:
    structured_response = state.get("structured_response")
    if structured_response is None:
        return 0, 0

    answer_text = getattr(structured_response, "answer_text", "")
    citations = getattr(structured_response, "citations", [])
    answer_chars = len(answer_text) if isinstance(answer_text, str) else 0
    citation_count = len(citations) if isinstance(citations, list) else 0
    return answer_chars, citation_count


class AnswerAgentLoggingMiddleware(AgentMiddleware):
    name = "answer_agent_logging"

    def _log_before_agent(self, state: dict[str, Any]) -> None:
        messages = state.get("messages", [])
        latest_user_message = _extract_latest_user_message(state)
        logger.bind(
            agent="answer_agent",
            latest_user_message_preview=_preview_text(latest_user_message),
        ).debug(
            f"Starting answer agent run | message_count={len(messages)} "
            f"user_chars={len(latest_user_message)}"
        )

    def _log_after_agent(self, state: dict[str, Any]) -> None:
        messages = state.get("messages", [])
        answer_chars, citation_count = _extract_structured_response_metrics(state)
        logger.bind(agent="answer_agent").info(
            f"Completed answer agent run | message_count={len(messages)} "
            f"answer_chars={answer_chars} citations={citation_count}"
        )

    def before_agent(self, state: dict[str, Any], runtime: Runtime) -> dict[str, Any] | None:
        self._log_before_agent(state)
        return None

    async def abefore_agent(
        self, state: dict[str, Any], runtime: Runtime
    ) -> dict[str, Any] | None:
        self._log_before_agent(state)
        return None

    def after_agent(self, state: dict[str, Any], runtime: Runtime) -> dict[str, Any] | None:
        self._log_after_agent(state)
        return None

    async def aafter_agent(
        self, state: dict[str, Any], runtime: Runtime
    ) -> dict[str, Any] | None:
        self._log_after_agent(state)
        return None

    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command[Any]],
    ) -> ToolMessage | Command[Any]:
        tool_name = request.tool_call.get("name", "unknown")
        tool_args = request.tool_call.get("args", {})
        query = tool_args.get("query", "") if isinstance(tool_args, dict) else ""
        log = logger.bind(
            agent="answer_agent",
            tool_name=tool_name,
            query_preview=_preview_text(query) if isinstance(query, str) else "",
        )
        log.debug(f"Calling tool '{tool_name}'")
        try:
            result = handler(request)
        except Exception as exc:
            log.exception(f"Tool '{tool_name}' failed: {exc}")
            raise

        log.info(f"Completed tool '{tool_name}'")
        return result

    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], Awaitable[ToolMessage | Command[Any]]],
    ) -> ToolMessage | Command[Any]:
        tool_name = request.tool_call.get("name", "unknown")
        tool_args = request.tool_call.get("args", {})
        query = tool_args.get("query", "") if isinstance(tool_args, dict) else ""
        log = logger.bind(
            agent="answer_agent",
            tool_name=tool_name,
            query_preview=_preview_text(query) if isinstance(query, str) else "",
        )
        log.debug(f"Calling tool '{tool_name}'")
        try:
            result = await handler(request)
        except Exception as exc:
            log.exception(f"Tool '{tool_name}' failed: {exc}")
            raise

        log.info(f"Completed tool '{tool_name}'")
        return result


def build_answer_agent_middlewares() -> Sequence[AgentMiddleware]:
    return [
        AnswerAgentLoggingMiddleware(),
        ToolCallLimitMiddleware(
            run_limit=settings.ANSWER_AGENT_MAX_TOOL_CALLS,
            exit_behavior="continue",
        ),
        ModelCallLimitMiddleware(
            run_limit=settings.ANSWER_AGENT_MAX_MODEL_CALLS,
            exit_behavior="end",
        ),
        ToolRetryMiddleware(max_retries=2),
    ]
