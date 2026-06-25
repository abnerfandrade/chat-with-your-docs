from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI
from fastapi.responses import StreamingResponse
from loguru import logger

from src.repositories.chats import ChatRepository
from src.repositories.messages import MessageRepository
from src.routes.chat.datatypes import (
    ChatResponse,
    ChatStreamInput,
    CitationResponse,
    MessageResponse,
)
from src.routes.chat.service import (
    DEFAULT_STREAM_ERROR_MESSAGE,
    extract_stream_text,
    normalize_citations,
    persist_assistant_message,
    prepare_chat_stream,
    resolve_assistant_response,
    serialize_sse_event,
    unpack_graph_stream_chunk,
)
from src.agents.graph import get_chat_graph

router = APIRouter(tags=["chat"])


def init_app(app: FastAPI) -> None:
    app.include_router(router)


def _serialize_citations(citations: Any) -> list[CitationResponse]:
    return [
        CitationResponse.model_validate(citation)
        for citation in normalize_citations(citations)
    ]


@router.get("/chats", response_model=list[ChatResponse])
async def list_chats(
    chat_repo: ChatRepository = Depends(ChatRepository),
) -> list[ChatResponse]:
    chats = await chat_repo.get_all()

    return [
        ChatResponse(
            id=str(chat.id),
            title=chat.title,
            created_at=chat.created_at,
        )
        for chat in chats
    ]


@router.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def list_chat_messages(
    chat_id: UUID,
    message_repo: MessageRepository = Depends(MessageRepository),
) -> list[MessageResponse]:
    messages = await message_repo.get_by_chat_id(chat_id)

    return [
        MessageResponse(
            id=str(message.id),
            chat_id=str(message.chat_id),
            role=message.role,
            content=message.content,
            citations=_serialize_citations(message.citations_json),
            created_at=message.created_at,
        )
        for message in messages
    ]


@router.post("/chat/stream")
async def stream_chat(payload: ChatStreamInput) -> StreamingResponse:
    prepared = await prepare_chat_stream(
        message=payload.message,
        chat_id=payload.chat_id,
    )

    async def event_stream():
        chat_id = prepared.chat_id
        graph = get_chat_graph()
        log = logger.bind(service="chat_stream", chat_id=str(chat_id))
        final_state: dict[str, Any] | None = None
        streamed_parts: list[str] = []

        yield serialize_sse_event("chat_id", {"chat_id": str(chat_id)})

        try:
            async for chunk in graph.astream(
                prepared.graph_input,
                stream_mode=["custom", "values"],
            ):
                mode, data = unpack_graph_stream_chunk(chunk)
                if mode == "custom":
                    text = extract_stream_text(data)
                    if text:
                        streamed_parts.append(text)
                        yield serialize_sse_event("content", {"text": text})
                    continue

                if mode == "values" and isinstance(data, dict):
                    final_state = data

            answer_text, citations = resolve_assistant_response(
                final_state,
                streamed_text="".join(streamed_parts),
            )

            if answer_text and not streamed_parts:
                yield serialize_sse_event("content", {"text": answer_text})

            await persist_assistant_message(
                chat_id=chat_id,
                content=answer_text,
                citations=citations,
            )

            yield serialize_sse_event("citations", {"citations": citations})
            yield serialize_sse_event("done", "[DONE]")
            log.info(
                f"Chat stream completed | citations={len(citations)} chars={len(answer_text)}"
            )
        except Exception as exc:
            logger.bind(service="chat_stream", chat_id=str(chat_id)).exception(
                f"Chat streaming failed: {exc}"
            )
            yield serialize_sse_event("error", {"error": DEFAULT_STREAM_ERROR_MESSAGE})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
