from unittest.mock import call

import pytest
from langchain_core.messages import AIMessageChunk, HumanMessage

from src.agents.answer_agent.node import answer_agent_node, get_answer_agent
from src.agents.answer_agent.datatypes import AnswerAgentResult
from src.agents.answer_agent.datatypes import CitationPayload


def test_get_answer_agent_builds_create_agent_with_expected_dependencies(mocker):
    get_answer_agent.cache_clear()
    model = mocker.Mock(name="llm")
    middlewares = [mocker.Mock(name="middleware")]
    agent = mocker.Mock(name="answer_agent")
    get_llm = mocker.patch(
        "src.agents.answer_agent.node.get_llm",
        return_value=model,
    )
    build_middlewares = mocker.patch(
        "src.agents.answer_agent.node.build_answer_agent_middlewares",
        return_value=middlewares,
    )
    tool = mocker.Mock(name="search_documents")
    mocker.patch("src.agents.answer_agent.node.search_documents", new=tool)
    create_agent = mocker.patch(
        "src.agents.answer_agent.node.create_agent",
        return_value=agent,
    )

    result = get_answer_agent()

    assert result is agent
    get_llm.assert_called_once()
    build_middlewares.assert_called_once()
    create_agent.assert_called_once()
    kwargs = create_agent.call_args.kwargs
    assert kwargs["model"] is model
    assert kwargs["tools"] == [tool]
    assert kwargs["middleware"] == middlewares
    assert kwargs["name"] == "answer_agent"
    assert kwargs["response_format"] is AnswerAgentResult


def test_get_answer_agent_is_cached(mocker):
    get_answer_agent.cache_clear()
    mocker.patch("src.agents.answer_agent.node.get_llm", return_value=mocker.Mock())
    mocker.patch(
        "src.agents.answer_agent.node.build_answer_agent_middlewares",
        return_value=[],
    )
    mocker.patch(
        "src.agents.answer_agent.node.search_documents",
        new=mocker.Mock(name="search_documents"),
    )
    create_agent = mocker.patch(
        "src.agents.answer_agent.node.create_agent",
        return_value=mocker.Mock(name="answer_agent"),
    )

    first = get_answer_agent()
    second = get_answer_agent()

    assert first is second
    create_agent.assert_called_once()


@pytest.mark.asyncio
async def test_answer_agent_node_extracts_structured_response(mocker):
    agent = mocker.Mock()
    agent.astream = mocker.Mock(return_value=_build_answer_agent_stream())
    mocker.patch("src.agents.answer_agent.node.get_answer_agent", return_value=agent)
    writer = mocker.Mock()
    mocker.patch("src.agents.answer_agent.node.get_stream_writer", return_value=writer)

    result = await answer_agent_node(
        {
            "messages": [HumanMessage(content="What is the policy?")],
            "latest_user_message": "What is the policy?",
            "guardrails_decision": None,
            "answer_text": None,
            "citations": [],
        }
    )

    assert result["answer_text"] == "The policy requires manager approval."
    assert len(result["citations"]) == 1
    assert result["messages"][0].content == "The policy requires manager approval."
    agent.astream.assert_called_once_with(
        {"messages": [HumanMessage(content="What is the policy?")]},
        stream_mode=["messages", "values"],
    )
    writer.assert_called_once_with(
        {"event": "content", "text": "The policy requires manager approval."}
    )


@pytest.mark.asyncio
async def test_answer_agent_node_streams_only_answer_text_from_structured_output(mocker):
    agent = mocker.Mock()
    agent.astream = mocker.Mock(return_value=_build_structured_answer_agent_stream())
    mocker.patch("src.agents.answer_agent.node.get_answer_agent", return_value=agent)
    writer = mocker.Mock()
    mocker.patch("src.agents.answer_agent.node.get_stream_writer", return_value=writer)

    result = await answer_agent_node(
        {
            "messages": [HumanMessage(content="What is the policy?")],
            "latest_user_message": "What is the policy?",
            "guardrails_decision": None,
            "answer_text": None,
            "citations": [],
        }
    )

    assert result["answer_text"] == "The policy requires manager approval."
    assert len(result["citations"]) == 1
    assert writer.call_args_list == [
        call({"event": "content", "text": "The policy requires "}),
        call({"event": "content", "text": "manager approval."}),
    ]


async def _build_answer_agent_stream():
    yield (
        "messages",
        (
            AIMessageChunk(content="The policy requires manager approval."),
            {},
        ),
    )
    yield (
        "values",
        {
            "structured_response": AnswerAgentResult(
                answer_text="The policy requires manager approval.",
                citations=[
                    CitationPayload(
                        document_id="doc-1",
                        source="policy.md",
                        chunk_id="doc-1::chunk::0",
                        page=None,
                        snippet="Manager approval is required.",
                    )
                ],
            )
        },
    )


async def _build_structured_answer_agent_stream():
    yield ("messages", (AIMessageChunk(content="{"), {}))
    yield ("messages", (AIMessageChunk(content='"answer_text"'), {}))
    yield ("messages", (AIMessageChunk(content=': "The policy requires '), {}))
    yield ("messages", (AIMessageChunk(content='manager approval."'), {}))
    yield (
        "messages",
        (
            AIMessageChunk(
                content=(
                    ', "citations": [{"document_id":"doc-1","source":"policy.md",'
                    '"chunk_id":"doc-1::chunk::0","page":null,'
                    '"snippet":"Manager approval is required."}]}'
                )
            ),
            {},
        ),
    )
    yield (
        "values",
        {
            "structured_response": AnswerAgentResult(
                answer_text="The policy requires manager approval.",
                citations=[
                    CitationPayload(
                        document_id="doc-1",
                        source="policy.md",
                        chunk_id="doc-1::chunk::0",
                        page=None,
                        snippet="Manager approval is required.",
                    )
                ],
            )
        },
    )
