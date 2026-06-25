from contextlib import asynccontextmanager
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from langchain_core.messages import AIMessage, HumanMessage

from src.routes.chat.service import prepare_chat_stream, resolve_assistant_response


class StubChatRepository:
    def __init__(self, *, created_chat=None, existing_chat=None, events=None):
        self.created_chat = created_chat or SimpleNamespace(id=uuid4())
        self.existing_chat = existing_chat
        self.events = events if events is not None else []

    async def create(self, data):
        self.events.append(("chat.create", data.title))
        return self.created_chat

    async def get_by_id(self, chat_id):
        self.events.append(("chat.get_by_id", chat_id))
        return self.existing_chat


class StubMessageRepository:
    def __init__(self, *, history=None, events=None):
        self.history = history or []
        self.events = events if events is not None else []

    async def get_by_chat_id(self, chat_id):
        self.events.append(("message.get_by_chat_id", chat_id))
        return self.history

    async def create(self, data):
        self.events.append(("message.create", data.role, data.content))
        return data


@asynccontextmanager
async def fake_session():
    yield object()


@pytest.mark.asyncio
async def test_prepare_chat_stream_saves_user_message_before_graph_invocation():
    events: list[tuple] = []
    chat_id = uuid4()
    chat_repo = StubChatRepository(
        created_chat=SimpleNamespace(id=chat_id),
        events=events,
    )
    message_repo = StubMessageRepository(
        history=[
            SimpleNamespace(
                role="assistant",
                content="Earlier answer",
                created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            )
        ],
        events=events,
    )

    prepared = await prepare_chat_stream(
        message="What changed?",
        chat_id=None,
        session_factory=fake_session,
        chat_repository_factory=lambda _session: chat_repo,
        message_repository_factory=lambda _session: message_repo,
    )

    assert events == [
        ("chat.create", "What changed?"),
        ("message.get_by_chat_id", chat_id),
        ("message.create", "user", "What changed?"),
    ]
    assert isinstance(prepared.graph_input["messages"][0], AIMessage)
    assert isinstance(prepared.graph_input["messages"][1], HumanMessage)
    assert prepared.graph_input["messages"][1].content == "What changed?"


def test_resolve_assistant_response_prefers_guardrails_message():
    final_state = {
        "answer_text": "",
        "citations": [],
        "guardrails_decision": SimpleNamespace(
            verdict="refuse",
            message_to_user="I can only answer questions about uploaded documents.",
        ),
    }

    answer_text, citations = resolve_assistant_response(final_state)

    assert answer_text == "I can only answer questions about uploaded documents."
    assert citations == []
