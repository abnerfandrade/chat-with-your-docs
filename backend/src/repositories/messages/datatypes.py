from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    chat_id: UUID = Field(..., description="Chat ID")
    role: Literal["user", "assistant"] = Field(..., description="Message author role")
    content: str = Field(..., description="Message content")
    citations_json: Optional[dict | list] = Field(None, description="Stored citations payload")


class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, description="Updated message content")
    citations_json: Optional[dict | list] = Field(None, description="Updated citations payload")


class MessageFilters(BaseModel):
    chat_id: Optional[UUID] = Field(None, description="Chat ID filter")
    role: Optional[Literal["user", "assistant"]] = Field(None, description="Role filter")
    created_after: Optional[datetime] = Field(None, description="Created after this datetime")
    created_before: Optional[datetime] = Field(None, description="Created before this datetime")
