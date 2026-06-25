from datetime import datetime, timezone
from uuid import uuid4

import pytest

from src.db.models import Chat, Message
from src.routes.chat import list_chat_messages, list_chats
from src.routes.chat.service import PreparedChatStream


class StubChatRepository:
    def __init__(self, chats=None):
        self.chats = chats or []

    async def get_all(self):
        return self.chats


class StubMessageRepository:
    def __init__(self, messages=None):
        self.messages = messages or []

    async def get_by_chat_id(self, _chat_id):
        return self.messages


class FakeGraph:
    def __init__(self, stream_chunks):
        self.stream_chunks = stream_chunks
        self.calls = []

    async def astream(self, graph_input, stream_mode):
        self.calls.append(
            {
                "graph_input": graph_input,
                "stream_mode": stream_mode,
            }
        )
        for chunk in self.stream_chunks:
            yield chunk


@pytest.mark.asyncio
async def test_list_chats_returns_serialized_chats():
    newer = Chat(
        id=uuid4(),
        title="Newer chat",
        created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )
    older = Chat(
        id=uuid4(),
        title="Older chat",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    response = await list_chats(StubChatRepository(chats=[newer, older]))

    assert [chat.title for chat in response] == ["Newer chat", "Older chat"]


@pytest.mark.asyncio
async def test_list_chat_messages_returns_serialized_messages():
    chat_id = uuid4()
    messages = [
        Message(
            id=uuid4(),
            chat_id=chat_id,
            role="assistant",
            content="Grounded answer",
            citations_json=[
                {
                    "document_id": "doc-1",
                    "source": "handbook.pdf",
                    "chunk_id": "doc-1::chunk::0",
                    "page": 2,
                    "snippet": "Handbook excerpt",
                }
            ],
            created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        )
    ]

    response = await list_chat_messages(chat_id, StubMessageRepository(messages=messages))

    assert len(response) == 1
    assert response[0].content == "Grounded answer"
    assert response[0].citations[0].source == "handbook.pdf"


@pytest.mark.asyncio
async def test_stream_chat_emits_chat_id_first_and_persists_assistant_message(
    async_client,
    mocker,
):
    chat_id = uuid4()
    prepared = PreparedChatStream(
        chat_id=chat_id,
        graph_input={"messages": [], "latest_user_message": "What changed?"},
    )
    graph = FakeGraph(
        stream_chunks=[
            ("custom", {"event": "content", "text": "The"}),
            ("custom", {"event": "content", "text": " policy changed."}),
            (
                "values",
                {
                    "answer_text": "The policy changed.",
                    "citations": [
                        {
                            "document_id": "doc-1",
                            "source": "policy.md",
                            "chunk_id": "doc-1::chunk::0",
                            "page": None,
                            "snippet": "Updated policy text",
                        }
                    ],
                },
            ),
        ]
    )
    prepare_stream = mocker.patch(
        "src.routes.chat.prepare_chat_stream",
        new=mocker.AsyncMock(return_value=prepared),
    )
    mocker.patch("src.routes.chat.get_chat_graph", return_value=graph)
    persist_assistant = mocker.patch(
        "src.routes.chat.persist_assistant_message",
        new=mocker.AsyncMock(),
    )

    response = await async_client.post(
        "/chat/stream",
        json={"message": "What changed?", "chat_id": None},
    )

    assert response.status_code == 200
    body = response.text
    assert body.startswith(f'event: chat_id\ndata: {{"chat_id": "{chat_id}"}}')
    assert 'event: content\ndata: {"text": "The"}' in body
    assert 'event: citations\ndata: {"citations": [' in body
    assert "event: done\ndata: [DONE]" in body
    prepare_stream.assert_awaited_once_with(
        message="What changed?",
        chat_id=None,
    )
    assert graph.calls[0]["stream_mode"] == ["custom", "values"]
    persist_assistant.assert_awaited_once_with(
        chat_id=chat_id,
        content="The policy changed.",
        citations=[
            {
                "document_id": "doc-1",
                "source": "policy.md",
                "chunk_id": "doc-1::chunk::0",
                "page": None,
                "snippet": "Updated policy text",
            }
        ],
    )


@pytest.mark.asyncio
async def test_stream_chat_emits_error_event_when_graph_fails(async_client, mocker):
    chat_id = uuid4()
    prepared = PreparedChatStream(
        chat_id=chat_id,
        graph_input={"messages": [], "latest_user_message": "What changed?"},
    )

    class ExplodingGraph:
        async def astream(self, _graph_input, stream_mode=None):
            raise RuntimeError("boom")
            yield

    mocker.patch(
        "src.routes.chat.prepare_chat_stream",
        new=mocker.AsyncMock(return_value=prepared),
    )
    mocker.patch("src.routes.chat.get_chat_graph", return_value=ExplodingGraph())
    persist_assistant = mocker.patch(
        "src.routes.chat.persist_assistant_message",
        new=mocker.AsyncMock(),
    )

    response = await async_client.post(
        "/chat/stream",
        json={"message": "What changed?", "chat_id": None},
    )

    assert response.status_code == 200
    assert "event: error" in response.text
    persist_assistant.assert_not_awaited()
