from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatCreate(BaseModel):
    title: str = Field(..., description="Chat title")


class ChatUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Updated chat title")


class ChatFilters(BaseModel):
    title: Optional[str] = Field(None, description="Partial title filter")
    created_after: Optional[datetime] = Field(None, description="Created after this datetime")
    created_before: Optional[datetime] = Field(None, description="Created before this datetime")
