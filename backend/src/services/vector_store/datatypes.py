from pydantic import BaseModel, Field


class EmbeddingStoreResult(BaseModel):
    collection_name: str = Field(..., description="Qdrant collection name")
    stored_count: int = Field(..., ge=0, description="Number of stored chunks")
    point_ids: list[str] = Field(
        default_factory=list,
        description="Deterministic point identifiers stored in Qdrant",
    )
