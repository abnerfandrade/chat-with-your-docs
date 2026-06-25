from langchain.agents.middleware import (
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
    ToolRetryMiddleware,
)
from langchain_core.messages import ToolMessage

from src.agents.answer_agent.middlewares import (
    AnswerAgentLoggingMiddleware,
    build_answer_agent_middlewares,
)


def test_build_answer_agent_middlewares_returns_expected_stack(settings_override):
    settings_override(
        ANSWER_AGENT_MAX_TOOL_CALLS=3,
        ANSWER_AGENT_MAX_MODEL_CALLS=4,
    )

    middlewares = list(build_answer_agent_middlewares())

    assert len(middlewares) == 4
    assert isinstance(middlewares[0], AnswerAgentLoggingMiddleware)
    assert isinstance(middlewares[1], ToolCallLimitMiddleware)
    assert isinstance(middlewares[2], ModelCallLimitMiddleware)
    assert isinstance(middlewares[3], ToolRetryMiddleware)
    assert middlewares[1].run_limit == 3
    assert middlewares[1].exit_behavior == "continue"
    assert middlewares[2].run_limit == 4
    assert middlewares[2].exit_behavior == "end"
    assert middlewares[3].max_retries == 2


def test_logging_middleware_logs_before_and_after_agent(mocker):
    middleware = AnswerAgentLoggingMiddleware()
    bound_logger = mocker.Mock()
    bind = mocker.patch(
        "src.agents.answer_agent.middlewares.logger.bind",
        return_value=bound_logger,
    )
    state = {"messages": ["m1", "m2"]}

    assert middleware.before_agent(state, runtime=None) is None
    assert middleware.after_agent(state, runtime=None) is None

    assert bind.call_count == 2
    bound_logger.debug.assert_called_once()
    bound_logger.info.assert_called_once()


def test_logging_middleware_wrap_tool_call_logs_around_handler(mocker):
    middleware = AnswerAgentLoggingMiddleware()
    bound_logger = mocker.Mock()
    mocker.patch(
        "src.agents.answer_agent.middlewares.logger.bind",
        return_value=bound_logger,
    )
    request = mocker.Mock()
    request.tool_call = {"name": "search_documents", "id": "tool-1", "args": {}}
    expected = ToolMessage(content="ok", tool_call_id="tool-1")
    handler = mocker.Mock(return_value=expected)

    result = middleware.wrap_tool_call(request, handler)

    assert result is expected
    handler.assert_called_once_with(request)
    bound_logger.debug.assert_called_once()
    bound_logger.info.assert_called_once()
