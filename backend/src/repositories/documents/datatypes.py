from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    filename: str = Field(..., description="Uploaded file name")
    content_type: Optional[str] = Field(None, description="Uploaded content type")
    size_bytes: int = Field(..., description="File size in bytes")
    file_hash: str = Field(..., description="SHA-256 hash of file content")
    status: Literal["queued", "processing", "completed", "failed"] = Field(
        ..., description="Document processing status"
    )


class DocumentUpdate(BaseModel):
    content_type: Optional[str] = Field(None, description="Uploaded content type")
    status: Optional[Literal["queued", "processing", "completed", "failed"]] = Field(
        None, description="Updated processing status"
    )
    error_message: Optional[str] = Field(None, description="Error detail when processing fails")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class DocumentFilters(BaseModel):
    filename: Optional[str] = Field(None, description="Partial file name filter")
    status: Optional[Literal["queued", "processing", "completed", "failed"]] = Field(
        None, description="Processing status filter"
    )
    created_after: Optional[datetime] = Field(None, description="Created after this datetime")
    created_before: Optional[datetime] = Field(None, description="Created before this datetime")
