from functools import lru_cache

from loguru import logger
from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, SparseVectorParams, VectorParams

from src.core.config import settings


def get_embeddings_client(for_query: bool = False) -> Embeddings:
    if settings.LLM_PROVIDER == "gemini":
        logger.debug(
            f"Initializing Gemini embeddings client | "
            f"model='{settings.GEMINI_EMBEDDING_MODEL}' for_query={for_query}"
        )
        return GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBEDDING_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            task_type="RETRIEVAL_QUERY" if for_query else "RETRIEVAL_DOCUMENT",
            output_dimensionality=settings.QDRANT_VECTOR_SIZE,
        )

    if settings.LLM_PROVIDER == "openai":
        logger.debug(
            f"Initializing OpenAI embeddings client | "
            f"model='{settings.OPENAI_EMBEDDING_MODEL}' for_query={for_query}"
        )
        return OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
            dimensions=settings.QDRANT_VECTOR_SIZE,
        )

    raise ValueError(f"Unsupported embeddings provider: '{settings.LLM_PROVIDER}'")


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    logger.debug(f"Connecting to Qdrant at '{settings.QDRANT_URL}'")
    try:
        client = QdrantClient(url=settings.QDRANT_URL)
        logger.debug("Qdrant client initialized successfully")
        return client
    except Exception as exc:
        logger.exception(
            f"Failed to connect to Qdrant at '{settings.QDRANT_URL}'. Error: {str(exc)}"
        )
        raise


def ensure_collection_exists(client: QdrantClient) -> None:
    if client.collection_exists(settings.QDRANT_COLLECTION_NAME):
        logger.debug(
            f"Qdrant collection '{settings.QDRANT_COLLECTION_NAME}' already exists"
        )
        return

    client.create_collection(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        vectors_config={
            "dense": VectorParams(
                size=settings.QDRANT_VECTOR_SIZE,
                distance=Distance.COSINE,
            )
        },
        sparse_vectors_config={
            "sparse": SparseVectorParams(),
        },
    )
    logger.info(f"Created Qdrant collection '{settings.QDRANT_COLLECTION_NAME}'")


def get_vector_store(for_query: bool = False) -> QdrantVectorStore:
    try:
        client = get_qdrant_client()
        ensure_collection_exists(client)

        return QdrantVectorStore(
            client=client,
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding=get_embeddings_client(for_query=for_query),
            sparse_embedding=FastEmbedSparse(model_name="Qdrant/bm25"),
            retrieval_mode=RetrievalMode.HYBRID,
            vector_name="dense",
            sparse_vector_name="sparse",
        )
    except Exception as exc:
        logger.exception(
            f"Failed to initialize vector store "
            f"(collection='{settings.QDRANT_COLLECTION_NAME}'). Error: {str(exc)}"
        )
        raise
