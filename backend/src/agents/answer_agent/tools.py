import asyncio

from langchain.tools import tool
from langchain_core.documents import Document
from loguru import logger

from src.agents.answer_agent.datatypes import RetrievedChunk
from src.services.vector_store.retriever import VectorStoreRetriever

EMPTY_RETRIEVAL_RESULT_MESSAGE = "No relevant uploaded documents were found for this query."


def _preview_text(text: str, *, limit: int = 120) -> str:
    normalized = " ".join(text.split()).strip()
    if len(normalized) <= limit:
        return normalized

    return f"{normalized[: limit - 3].rstrip()}..."


def _document_to_retrieved_chunk(document: Document) -> RetrievedChunk:
    metadata = document.metadata or {}
    return RetrievedChunk(
        document_id=str(metadata.get("document_id", "")),
        source=str(metadata.get("source", "unknown")),
        chunk_id=str(metadata.get("chunk_id", "")),
        page=metadata.get("page"),
        content=document.page_content or str(metadata.get("content", "")),
    )


def _format_retrieved_chunks(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return EMPTY_RETRIEVAL_RESULT_MESSAGE

    sections = []
    for index, chunk in enumerate(chunks, start=1):
        page = str(chunk.page) if chunk.page is not None else "unknown"
        sections.append(
            "\n".join(
                [
                    f"[chunk {index}]",
                    f"document_id: {chunk.document_id}",
                    f"source: {chunk.source}",
                    f"chunk_id: {chunk.chunk_id}",
                    f"page: {page}",
                    "content:",
                    chunk.content,
                ]
            )
        )

    return "\n\n---\n\n".join(sections)


@tool
async def search_documents(query: str) -> str:
    """Search uploaded documents and return deterministic chunk blocks for grounding.

    Use concise retrieval-oriented queries. Prefer the core concepts of the user's
    question over the full raw sentence when appropriate.
    """
    normalized_query = query.strip()
    log = logger.bind(
        service="search_documents_tool",
        query_preview=_preview_text(normalized_query),
        query_chars=len(normalized_query),
    )

    if not normalized_query:
        log.warning("Skipping retrieval because the tool query was empty")
        return EMPTY_RETRIEVAL_RESULT_MESSAGE

    retriever = VectorStoreRetriever()
    log.debug("Searching uploaded documents")

    try:
        documents = await asyncio.to_thread(retriever.search, normalized_query)
    except Exception as exc:
        log.exception(f"Document retrieval failed: {exc}")
        raise RuntimeError(
            "Failed to search the uploaded documents for grounding context."
        ) from exc

    chunks = [_document_to_retrieved_chunk(document) for document in documents]
    log.info(f"Retrieved {len(chunks)} chunk(s) from the shared corpus")

    return _format_retrieved_chunks(chunks)
