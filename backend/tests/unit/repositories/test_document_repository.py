import uuid
from unittest.mock import MagicMock

import pytest

from src.db.models import Document
from src.repositories.documents.datatypes import (
    DocumentCreate,
    DocumentFilters,
    DocumentUpdate,
)
from src.repositories.documents.exceptions import DocumentNotFoundError
from src.repositories.documents.repository import DocumentRepository


def _scalar_result(value):
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


def _list_result(values):
    result = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = values
    result.scalars.return_value = scalars
    return result


@pytest.mark.asyncio
async def test_document_repository_create_and_get_by_hash(mock_session):
    repository = DocumentRepository(mock_session)

    created = await repository.create(
        DocumentCreate(
            filename="doc.pdf",
            content_type="application/pdf",
            size_bytes=123,
            file_hash="abc123",
            status="queued",
        )
    )
    created.id = uuid.uuid4()
    mock_session.execute.return_value = _scalar_result(created)

    found = await repository.get_by_hash("abc123")

    assert found is not None
    assert found.filename == "doc.pdf"
    assert found.file_hash == "abc123"


@pytest.mark.asyncio
async def test_document_repository_get_all_with_filters(mock_session):
    repository = DocumentRepository(mock_session)
    documents = [
        Document(
            id=uuid.uuid4(),
            filename="rag-guide.pdf",
            content_type="application/pdf",
            size_bytes=100,
            file_hash="hash-1",
            status="completed",
        )
    ]
    mock_session.execute.return_value = _list_result(documents)

    results = await repository.get_all(DocumentFilters(status="completed", filename="rag"))

    assert len(results) == 1
    assert results[0].filename == "rag-guide.pdf"


@pytest.mark.asyncio
async def test_document_repository_update(mock_session):
    repository = DocumentRepository(mock_session)
    document = Document(
        id=uuid.uuid4(),
        filename="doc.pdf",
        content_type="application/pdf",
        size_bytes=123,
        file_hash="abc1234",
        status="queued",
    )
    mock_session.execute.return_value = _scalar_result(document)

    updated = await repository.update(
        document.id,
        DocumentUpdate(status="completed"),
    )

    assert updated.status == "completed"


@pytest.mark.asyncio
async def test_document_repository_delete(mock_session):
    repository = DocumentRepository(mock_session)
    document = Document(
        id=uuid.uuid4(),
        filename="delete.pdf",
        content_type="application/pdf",
        size_bytes=10,
        file_hash="delete-hash",
        status="queued",
    )
    mock_session.execute.return_value = _scalar_result(document)

    deleted = await repository.delete(document.id)

    assert deleted is True
    mock_session.delete.assert_awaited_once_with(document)


@pytest.mark.asyncio
async def test_document_repository_update_missing_raises(mock_session):
    repository = DocumentRepository(mock_session)
    missing_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
    mock_session.execute.return_value = _scalar_result(None)

    with pytest.raises(DocumentNotFoundError):
        await repository.update(
            missing_id,
            DocumentUpdate(status="failed"),
        )
