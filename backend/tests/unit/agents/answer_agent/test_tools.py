from langchain_core.documents import Document

from src.agents.answer_agent.datatypes import RetrievedChunk
from src.agents.answer_agent.tools import (
    _document_to_retrieved_chunk,
    _format_retrieved_chunks,
)


def test_document_to_retrieved_chunk_maps_metadata():
    document = Document(
        page_content="Coverage includes dental and vision.",
        metadata={
            "document_id": "doc-1",
            "source": "benefits.pdf",
            "chunk_id": "doc-1::chunk::0",
            "page": 3,
        },
    )

    chunk = _document_to_retrieved_chunk(document)

    assert chunk == RetrievedChunk(
        document_id="doc-1",
        source="benefits.pdf",
        chunk_id="doc-1::chunk::0",
        page=3,
        content="Coverage includes dental and vision.",
    )


def test_format_retrieved_chunks_returns_deterministic_block():
    chunks = [
        RetrievedChunk(
            document_id="doc-1",
            source="benefits.pdf",
            chunk_id="doc-1::chunk::0",
            page=3,
            content="Coverage includes dental and vision.",
        ),
        RetrievedChunk(
            document_id="doc-2",
            source="policy.md",
            chunk_id="doc-2::chunk::1",
            page=None,
            content="Remote work requires manager approval.",
        ),
    ]

    result = _format_retrieved_chunks(chunks)

    assert "[chunk 1]" in result
    assert "document_id: doc-1" in result
    assert "source: benefits.pdf" in result
    assert "chunk_id: doc-2::chunk::1" in result
    assert "page: 3" in result
    assert "page: unknown" in result
    assert "Remote work requires manager approval." in result


def test_format_retrieved_chunks_returns_empty_message_for_no_results():
    result = _format_retrieved_chunks([])

    assert result == "No relevant uploaded documents were found for this query."
