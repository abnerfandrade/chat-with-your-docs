from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    document_id: str = Field(..., description="Document identifier")
    source: str = Field(..., description="Source filename")
    chunk_id: str = Field(..., description="Chunk identifier")
    page: int | None = Field(None, description="Page number when available")
    content: str = Field(..., description="Retrieved chunk content")


class CitationPayload(BaseModel):
    document_id: str = Field(..., description="Document identifier")
    source: str = Field(..., description="Source filename")
    chunk_id: str = Field(..., description="Chunk identifier")
    page: int | None = Field(None, description="Page number when available")
    snippet: str = Field(..., description="Quoted or summarized snippet")


class AnswerAgentResult(BaseModel):
    answer_text: str = Field(..., description="Grounded answer text")
    citations: list[CitationPayload] = Field(
        default_factory=list,
        description="Citations derived from retrieved chunks",
    )
