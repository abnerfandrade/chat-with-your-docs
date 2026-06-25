from src.agents.answer_agent.agent import get_answer_agent
from src.agents.answer_agent.datatypes import AnswerAgentResult


def test_get_answer_agent_builds_create_agent_with_expected_dependencies(mocker):
    get_answer_agent.cache_clear()
    model = mocker.Mock(name="llm")
    middlewares = [mocker.Mock(name="middleware")]
    agent = mocker.Mock(name="answer_agent")
    get_llm = mocker.patch(
        "src.agents.answer_agent.agent.get_llm",
        return_value=model,
    )
    build_middlewares = mocker.patch(
        "src.agents.answer_agent.agent.build_answer_agent_middlewares",
        return_value=middlewares,
    )
    create_agent = mocker.patch(
        "src.agents.answer_agent.agent.create_agent",
        return_value=agent,
    )

    result = get_answer_agent()

    assert result is agent
    get_llm.assert_called_once()
    build_middlewares.assert_called_once()
    create_agent.assert_called_once()
    kwargs = create_agent.call_args.kwargs
    assert kwargs["model"] is model
    assert kwargs["middleware"] == middlewares
    assert kwargs["name"] == "answer_agent"
    assert kwargs["response_format"] is AnswerAgentResult


def test_get_answer_agent_is_cached(mocker):
    get_answer_agent.cache_clear()
    mocker.patch("src.agents.answer_agent.agent.get_llm", return_value=mocker.Mock())
    mocker.patch(
        "src.agents.answer_agent.agent.build_answer_agent_middlewares",
        return_value=[],
    )
    create_agent = mocker.patch(
        "src.agents.answer_agent.agent.create_agent",
        return_value=mocker.Mock(name="answer_agent"),
    )

    first = get_answer_agent()
    second = get_answer_agent()

    assert first is second
    create_agent.assert_called_once()
