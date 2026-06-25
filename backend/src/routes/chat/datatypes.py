from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatStreamInput(BaseModel):
    message: str = Field(..., min_length=1, description="Latest user message")
    chat_id: UUID | None = Field(None, description="Existing chat identifier")


class CitationResponse(BaseModel):
    document_id: str = Field(..., description="Document identifier")
    source: str = Field(..., description="Source filename")
    chunk_id: str = Field(..., description="Chunk identifier")
    page: int | None = Field(None, description="Page number when available")
    snippet: str = Field(..., description="Snippet shown to the user")


class MessageResponse(BaseModel):
    id: str = Field(..., description="Message identifier")
    chat_id: str = Field(..., description="Owning chat identifier")
    role: str = Field(..., description="Message author role")
    content: str = Field(..., description="Message body")
    citations: list[CitationResponse] = Field(
        default_factory=list,
        description="Assistant citations for this message",
    )
    created_at: datetime = Field(..., description="Creation timestamp")


class ChatResponse(BaseModel):
    id: str = Field(..., description="Chat identifier")
    title: str = Field(..., description="Chat title")
    created_at: datetime = Field(..., description="Creation timestamp")
