from uuid import uuid4

import pytest

from src.services.rag_pipeline.chunker import TokenChunker
from src.services.rag_pipeline.datatypes import ChunkDocument


def test_chunker_returns_chunk_models_with_expected_metadata(mocker, settings_override):
    settings_override(CHUNK_SIZE_TOKENS=1000, CHUNK_OVERLAP_TOKENS=150)
    splitter = mocker.Mock()
    splitter.split_text.return_value = ["first chunk", "second chunk"]
    splitter_ctor = mocker.patch(
        "src.services.rag_pipeline.chunker.RecursiveCharacterTextSplitter",
        return_value=splitter,
    )
    document_id = uuid4()

    chunker = TokenChunker()
    chunks = chunker.chunk(
        text="A long enough text to split.",
        source="handbook.pdf",
        document_id=document_id,
    )

    assert len(chunks) == 2
    assert all(isinstance(chunk, ChunkDocument) for chunk in chunks)
    assert chunks[0].content == "first chunk"
    assert chunks[0].metadata.document_id == document_id
    assert chunks[0].metadata.source == "handbook.pdf"
    assert chunks[0].metadata.chunk_id == f"{document_id}::chunk::0"
    assert chunks[0].metadata.chunk_index == 0
    assert chunks[0].metadata.total_chunks == 2
    assert chunks[0].metadata.page is None
    assert chunks[1].metadata.chunk_id == f"{document_id}::chunk::1"

    splitter.split_text.assert_called_once_with("A long enough text to split.")
    splitter_ctor.assert_called_once()


def test_chunker_raises_for_empty_text():
    chunker = TokenChunker()

    with pytest.raises(ValueError, match="Empty text cannot be chunked"):
        chunker.chunk(text="   ", source="empty.txt", document_id=uuid4())
