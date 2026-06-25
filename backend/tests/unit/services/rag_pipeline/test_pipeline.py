from types import SimpleNamespace
from uuid import uuid4

import pytest

from src.services.rag_pipeline.datatypes import RagPipelineResult
from src.services.rag_pipeline.pipeline import RagPipeline


@pytest.mark.asyncio
async def test_rag_pipeline_runs_all_steps(sample_chunk, mocker):
    document_id = uuid4()
    extractor = SimpleNamespace(extract=None)
    chunker = SimpleNamespace(chunk=None)
    embedder = SimpleNamespace(embed_and_store=None)
    to_thread = mocker.patch(
        "src.services.rag_pipeline.pipeline.asyncio.to_thread",
        new=mocker.AsyncMock(side_effect=lambda func, *args, **kwargs: func(*args, **kwargs)),
    )

    async def extract(content: bytes, filename: str):
        assert content == b"hello world"
        assert filename == "doc.txt"
        return "normalized content"

    def chunk(text: str, source: str, document_id):
        assert text == "normalized content"
        assert source == "doc.txt"
        return [sample_chunk]

    def embed_and_store(chunks):
        assert chunks == [sample_chunk]
        return SimpleNamespace(stored_count=1)

    extractor.extract = extract
    chunker.chunk = chunk
    embedder.embed_and_store = embed_and_store

    pipeline = RagPipeline(
        extractor=extractor,
        chunker=chunker,
        embedder=embedder,
    )
    result = await pipeline.run(
        document_id=document_id,
        content=b"hello world",
        filename="doc.txt",
    )

    assert isinstance(result, RagPipelineResult)
    assert result.document_id == document_id
    assert result.filename == "doc.txt"
    assert result.char_count == len("normalized content")
    assert result.chunk_count == 1
    assert result.stored_count == 1
    assert to_thread.await_count == 2


@pytest.mark.asyncio
async def test_rag_pipeline_wraps_extraction_failures():
    async def extract(*_args, **_kwargs):
        raise ValueError("broken extractor")

    pipeline = RagPipeline(
        extractor=SimpleNamespace(extract=extract),
        chunker=SimpleNamespace(chunk=lambda *_args, **_kwargs: []),
        embedder=SimpleNamespace(embed_and_store=lambda *_args, **_kwargs: None),
    )

    with pytest.raises(RuntimeError, match="Failed to extract document"):
        await pipeline.run(
            document_id=uuid4(),
            content=b"content",
            filename="broken.txt",
        )
