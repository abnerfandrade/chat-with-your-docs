from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import models
from loguru import logger

from src.services.vector_store.store import get_vector_store


class VectorStoreRetriever:
    def __init__(
        self,
        k: int = 5,
        score_threshold: float | None = None,
        vector_store: QdrantVectorStore | None = None,
    ):
        self.logger = logger.bind(
            service="vector_store_retriever",
            default_k=k,
            default_score_threshold=score_threshold,
        )
        self.vector_store = vector_store or get_vector_store(for_query=True)
        self._k = k
        self._score_threshold = score_threshold

    def search(
        self,
        query: str,
        k: int | None = None,
        score_threshold: float | None = None,
        filter: models.Filter | None = None,
    ) -> list[Document]:
        effective_k = k if k is not None else self._k
        effective_score_threshold = (
            score_threshold if score_threshold is not None else self._score_threshold
        )

        self.logger.debug(
            f"Searching vector store | query='{query[:80]}' k={effective_k} "
            f"score_threshold={effective_score_threshold}"
        )

        try:
            search_kwargs = {
                "query": query,
                "k": effective_k,
            }
            if filter is not None:
                search_kwargs["filter"] = filter
            if effective_score_threshold is not None:
                search_kwargs["score_threshold"] = effective_score_threshold

            results = self.vector_store.similarity_search(**search_kwargs)
            self.logger.info(f"Retrieved {len(results)} documents from vector store")
            return results
        except Exception as exc:
            self.logger.exception(f"Vector store search failed. Error: {str(exc)}")
            raise
