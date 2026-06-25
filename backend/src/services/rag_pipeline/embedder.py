import uuid

from langchain_core.documents import Document
from loguru import logger
from qdrant_client.http.exceptions import UnexpectedResponse

from src.services.rag_pipeline.datatypes import ChunkDocument
from src.services.vector_store.datatypes import EmbeddingStoreResult
from src.services.vector_store.store import get_vector_store


class Embedder:
    def __init__(self, vector_store=None):
        self.logger = logger.bind(service="embedder")
        self.vector_store = vector_store or get_vector_store()

    def embed_and_store(self, chunks: list[ChunkDocument]) -> EmbeddingStoreResult:
        if not chunks:
            self.logger.warning("No chunks were provided for embedding/storage")
            return EmbeddingStoreResult(
                collection_name=self.vector_store.collection_name,
                stored_count=0,
                point_ids=[],
            )

        try:
            documents = [
                Document(
                    page_content=chunk.content,
                    metadata={
                        **chunk.metadata.model_dump(mode="json"),
                        "content": chunk.content,
                    },
                )
                for chunk in chunks
            ]
            point_ids = [
                str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.metadata.chunk_id))
                for chunk in chunks
            ]

            self.logger.debug(
                f"Generating embeddings and storing {len(documents)} chunks in Qdrant"
            )
            self.vector_store.add_documents(documents=documents, ids=point_ids)

            self.logger.info(f"Stored {len(documents)} chunks successfully")
            return EmbeddingStoreResult(
                collection_name=self.vector_store.collection_name,
                stored_count=len(documents),
                point_ids=point_ids,
            )
        except UnexpectedResponse as exc:
            self.logger.exception(
                f"Qdrant returned an unexpected response while storing chunks. "
                f"Status: {exc.status_code}"
            )
            raise
        except Exception as exc:
            self.logger.exception(f"Failed to embed/store chunks. Error: {str(exc)}")
            raise
