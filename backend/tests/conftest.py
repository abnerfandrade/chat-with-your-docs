from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import settings
from src.main import create_app
from src.services.rag_pipeline.datatypes import ChunkDocument, ChunkMetadata


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setattr(settings, "OPENAI_MODEL", "test-openai-model")
    monkeypatch.setattr(settings, "OPENAI_EMBEDDING_MODEL", "test-openai-embedding-model")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "test-gemini-model")
    monkeypatch.setattr(settings, "GEMINI_EMBEDDING_MODEL", "test-gemini-embedding-model")
    monkeypatch.setattr(settings, "QDRANT_URL", "http://qdrant.test")
    monkeypatch.setattr(settings, "QDRANT_COLLECTION_NAME", "chat_with_your_docs_test")
    monkeypatch.setattr(settings, "QDRANT_VECTOR_SIZE", 1536)
    monkeypatch.setattr(settings, "CHUNK_SIZE_TOKENS", 1000)
    monkeypatch.setattr(settings, "CHUNK_OVERLAP_TOKENS", 150)


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def async_client(app):
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


@pytest.fixture
def settings_override(monkeypatch):
    def _override(**values):
        for key, value in values.items():
            monkeypatch.setattr(settings, key, value)
        return settings

    return _override


@pytest.fixture
def mock_llm(mocker):
    return mocker.Mock(name="mock_llm")


@pytest.fixture
def mock_embeddings(mocker):
    return mocker.Mock(name="mock_embeddings")


@pytest.fixture
def fake_vector_store(mocker):
    store = mocker.Mock(name="fake_vector_store")
    store.add_documents = mocker.Mock()
    store.similarity_search = mocker.Mock(return_value=[])
    return store


@pytest.fixture
def sample_document_bytes():
    return b"Sample text document for tests."


@pytest.fixture
def sample_pdf_bytes():
    return b"%PDF-1.4 sample pdf bytes"


@pytest.fixture
def sample_chunk():
    document_id = uuid4()
    return ChunkDocument(
        content="Chunk content for tests.",
        metadata=ChunkMetadata(
            document_id=document_id,
            source="sample.pdf",
            chunk_id=f"{document_id}::chunk::0",
            chunk_index=0,
            total_chunks=1,
        ),
    )
