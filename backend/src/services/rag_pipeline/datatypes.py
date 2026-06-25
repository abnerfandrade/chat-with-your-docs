from uuid import UUID

from pydantic import BaseModel, Field


class ChunkMetadata(BaseModel):
    document_id: UUID = Field(..., description="Document identifier")
    source: str = Field(..., description="Original source name")
    chunk_id: str = Field(..., description="Stable chunk identifier")
    chunk_index: int = Field(..., ge=0, description="Zero-based chunk position")
    total_chunks: int = Field(..., gt=0, description="Total number of chunks generated")
    page: int | None = Field(None, ge=1, description="Source page number when available")


class ChunkDocument(BaseModel):
    content: str = Field(..., min_length=1, description="Chunk text content")
    metadata: ChunkMetadata = Field(..., description="Chunk metadata")
