from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Uploaded file name")
    content_type: str | None = Field(None, description="Detected content type")
    size_bytes: int = Field(..., description="File size in bytes")
    status: str = Field(..., description="Document processing status")
    error_message: str | None = Field(None, description="Processing error details")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")


class UploadResponse(BaseModel):
    id: str = Field(..., description="Created document ID")
    filename: str = Field(..., description="Uploaded file name")
    status: str = Field(..., description="Initial document status")
