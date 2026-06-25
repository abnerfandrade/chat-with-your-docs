import asyncio

from langchain.tools import tool
from langchain_core.documents import Document

from src.agents.answer_agent.datatypes import RetrievedChunk
from src.services.vector_store.retriever import VectorStoreRetriever


def _document_to_retrieved_chunk(document: Document) -> RetrievedChunk:
    metadata = document.metadata or {}
    return RetrievedChunk(
        document_id=str(metadata.get("document_id", "")),
        source=str(metadata.get("source", "unknown")),
        chunk_id=str(metadata.get("chunk_id", "")),
        page=metadata.get("page"),
        content=document.page_content,
    )


def _format_retrieved_chunks(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "No relevant uploaded documents were found for this query."

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
    retriever = VectorStoreRetriever()
    documents = await asyncio.to_thread(retriever.search, query)

    chunks = [_document_to_retrieved_chunk(document) for document in documents]

    return _format_retrieved_chunks(chunks)
