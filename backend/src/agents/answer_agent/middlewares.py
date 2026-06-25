from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from langchain.agents.middleware import (
    AgentMiddleware,
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
    ToolRetryMiddleware,
)
from langchain.agents.middleware.types import ToolCallRequest
from langchain_core.messages import ToolMessage
from langgraph.runtime import Runtime
from langgraph.types import Command
from loguru import logger

from src.core.config import settings


class AnswerAgentLoggingMiddleware(AgentMiddleware):
    name = "answer_agent_logging"

    def _log_before_agent(self, state: dict[str, Any]) -> None:
        messages = state.get("messages", [])
        logger.bind(agent="answer_agent").debug(
            f"Starting answer agent run | message_count={len(messages)}"
        )

    def _log_after_agent(self, state: dict[str, Any]) -> None:
        messages = state.get("messages", [])
        logger.bind(agent="answer_agent").info(
            f"Completed answer agent run | message_count={len(messages)}"
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
        log = logger.bind(agent="answer_agent", tool_name=tool_name)
        log.debug(f"Calling tool '{tool_name}'")
        result = handler(request)
        log.info(f"Completed tool '{tool_name}'")
        return result

    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], Awaitable[ToolMessage | Command[Any]]],
    ) -> ToolMessage | Command[Any]:
        tool_name = request.tool_call.get("name", "unknown")
        log = logger.bind(agent="answer_agent", tool_name=tool_name)
        log.debug(f"Calling tool '{tool_name}'")
        result = await handler(request)
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
