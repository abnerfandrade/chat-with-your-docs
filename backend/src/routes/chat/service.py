from __future__ import annotations

import json
from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from src.db.database import db
from src.repositories.chats import ChatCreate, ChatRepository
from src.repositories.messages import MessageCreate, MessageRepository

SessionFactory = Callable[[], AbstractAsyncContextManager]
ChatRepositoryFactory = Callable[[object], ChatRepository]
MessageRepositoryFactory = Callable[[object], MessageRepository]

DEFAULT_STREAM_ERROR_MESSAGE = "Failed to stream the assistant response."
DEFAULT_GUARDRAILS_MESSAGE = "I can't help with that request."


@dataclass
class PreparedChatStream:
    chat_id: UUID
    graph_input: dict[str, Any]


def build_chat_title(message: str, *, max_length: int = 80) -> str:
    normalized = " ".join(message.split()).strip() or "New chat"
    if len(normalized) <= max_length:
        return normalized

    return f"{normalized[: max_length - 3].rstrip()}..."


def serialize_sse_event(event: str, data: str | dict[str, Any] | list[Any]) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=True)
    return f"event: {event}\ndata: {payload}\n\n"


def _message_to_langchain_message(*, role: str, content: str) -> BaseMessage:
    if role == "user":
        return HumanMessage(content=content)
    if role == "assistant":
        return AIMessage(content=content)

    raise ValueError(f"Unsupported chat message role: '{role}'")


def normalize_citations(citations: Any) -> list[dict[str, Any]]:
    if citations is None:
        return []

    items = citations if isinstance(citations, list) else [citations]
    normalized: list[dict[str, Any]] = []
    for item in items:
        if hasattr(item, "model_dump"):
            item = item.model_dump()
        if not isinstance(item, dict):
            continue

        normalized.append(
            {
                "document_id": str(item.get("document_id", "")),
                "source": str(item.get("source", "")),
                "chunk_id": str(item.get("chunk_id", "")),
                "page": item.get("page"),
                "snippet": str(item.get("snippet", "")),
            }
        )

    return normalized


def resolve_assistant_response(
    final_state: dict[str, Any] | None,
    *,
    streamed_text: str = "",
) -> tuple[str, list[dict[str, Any]]]:
    state = final_state or {}
    answer_text = str(state.get("answer_text") or "").strip()
    citations = normalize_citations(state.get("citations"))

    if answer_text:
        return answer_text, citations

    decision = state.get("guardrails_decision")
    guardrails_message = getattr(decision, "message_to_user", None)
    if isinstance(guardrails_message, str) and guardrails_message.strip():
        return guardrails_message.strip(), []

    if streamed_text.strip():
        return streamed_text.strip(), citations

    return DEFAULT_GUARDRAILS_MESSAGE, []


async def prepare_chat_stream(
    *,
    message: str,
    chat_id: UUID | None,
    session_factory: SessionFactory | None = None,
    chat_repository_factory: ChatRepositoryFactory | None = None,
    message_repository_factory: MessageRepositoryFactory | None = None,
) -> PreparedChatStream:
    session_factory = session_factory or db.session
    chat_repository_factory = chat_repository_factory or (
        lambda session: ChatRepository(session=session)
    )
    message_repository_factory = message_repository_factory or (
        lambda session: MessageRepository(session=session)
    )

    new_message = message.strip()
    if not new_message:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    async with session_factory() as session:
        chat_repo = chat_repository_factory(session)
        if chat_id is None:
            chat = await chat_repo.create(
                ChatCreate(title=build_chat_title(new_message))
            )
        else:
            chat = await chat_repo.get_by_id(chat_id)
            if chat is None:
                raise HTTPException(status_code=404, detail="Chat not found.")

        resolved_chat_id = chat.id

    async with session_factory() as session:
        message_repo = message_repository_factory(session)
        stored_messages = await message_repo.get_by_chat_id(resolved_chat_id)

        await message_repo.create(
            MessageCreate(
                chat_id=resolved_chat_id,
                role="user",
                content=new_message,
            )
        )

    graph_messages = [
        _message_to_langchain_message(role=stored_message.role, content=stored_message.content)
        for stored_message in stored_messages
    ]
    graph_messages.append(HumanMessage(content=new_message))

    return PreparedChatStream(
        chat_id=resolved_chat_id,
        graph_input={
            "messages": graph_messages,
            "latest_user_message": new_message,
            "guardrails_decision": None,
            "answer_text": None,
            "citations": [],
        },
    )


async def persist_assistant_message(
    *,
    chat_id: UUID,
    content: str,
    citations: list[dict[str, Any]],
    session_factory: SessionFactory | None = None,
    message_repository_factory: MessageRepositoryFactory | None = None,
) -> None:
    session_factory = session_factory or db.session
    message_repository_factory = message_repository_factory or (
        lambda session: MessageRepository(session=session)
    )

    async with session_factory() as session:
        message_repo = message_repository_factory(session)
        await message_repo.create(
            MessageCreate(
                chat_id=chat_id,
                role="assistant",
                content=content,
                citations_json=citations,
            )
        )


def extract_stream_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ""
    if payload.get("event") != "content":
        return ""

    text = payload.get("text")
    return text if isinstance(text, str) else ""


def unpack_graph_stream_chunk(chunk: Any) -> tuple[str, Any]:
    if not isinstance(chunk, tuple) or len(chunk) != 2:
        raise ValueError("Unexpected graph stream chunk format")

    mode, payload = chunk
    if not isinstance(mode, str):
        raise ValueError("Graph stream mode must be a string")

    return mode, payload
