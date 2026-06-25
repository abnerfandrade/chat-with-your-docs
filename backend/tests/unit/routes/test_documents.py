import uuid
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from src.db.models import Document
from src.routes.documents import list_documents, upload_document


class StubDocumentRepository:
    def __init__(self, documents=None, existing_by_hash=None, created_document=None):
        self.documents = documents or []
        self.existing_by_hash = existing_by_hash
        self.created_document = created_document
        self.create_calls = []

    async def get_all(self):
        return self.documents

    async def get_by_hash(self, file_hash: str):
        return self.existing_by_hash

    async def create(self, data, *, commit: bool = False):
        self.create_calls.append((data, commit))
        if self.created_document is not None:
            return self.created_document

        now = datetime.now(timezone.utc)
        return Document(
            id=uuid.uuid4(),
            filename=data.filename,
            content_type=data.content_type,
            size_bytes=data.size_bytes,
            file_hash=data.file_hash,
            status=data.status,
            created_at=now,
            updated_at=None,
        )


class FakeUploadFile:
    def __init__(self, filename: str, content: bytes, content_type: str):
        self.filename = filename
        self.content_type = content_type
        self._content = content

    async def read(self) -> bytes:
        return self._content


def build_upload_file(filename: str, content: bytes, content_type: str) -> FakeUploadFile:
    return FakeUploadFile(
        filename=filename,
        content=content,
        content_type=content_type,
    )


@pytest.mark.asyncio
async def test_list_documents_returns_serialized_documents():
    older = Document(
        id=uuid.uuid4(),
        filename="older.pdf",
        content_type="application/pdf",
        size_bytes=100,
        file_hash="hash-1",
        status="queued",
        error_message=None,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        updated_at=None,
    )
    newer = Document(
        id=uuid.uuid4(),
        filename="newer.txt",
        content_type="text/plain",
        size_bytes=50,
        file_hash="hash-2",
        status="completed",
        error_message=None,
        created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        updated_at=None,
    )
    stub_repo = StubDocumentRepository(documents=[older, newer])

    response = await list_documents(stub_repo)

    assert len(response) == 2
    assert response[0].filename == "newer.txt"
    assert response[1].filename == "older.pdf"


@pytest.mark.asyncio
async def test_upload_document_rejects_unsupported_extension():
    stub_repo = StubDocumentRepository()

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=build_upload_file("notes.csv", b"content", "text/csv"),
            document_repo=stub_repo,
        )

    assert exc_info.value.status_code == 422
    assert "not supported" in exc_info.value.detail


@pytest.mark.asyncio
async def test_upload_document_rejects_duplicate_hash():
    existing = Document(
        id=uuid.uuid4(),
        filename="existing.pdf",
        content_type="application/pdf",
        size_bytes=100,
        file_hash="same-hash",
        status="completed",
        error_message=None,
        created_at=datetime.now(timezone.utc),
        updated_at=None,
    )
    stub_repo = StubDocumentRepository(existing_by_hash=existing)

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=build_upload_file("existing.pdf", b"same-content", "application/pdf"),
            document_repo=stub_repo,
        )

    assert exc_info.value.status_code == 409
    assert "same content" in exc_info.value.detail


@pytest.mark.asyncio
async def test_upload_document_accepts_valid_file_and_persists_queued_record():
    created = Document(
        id=uuid.uuid4(),
        filename="doc.txt",
        content_type="text/plain",
        size_bytes=11,
        file_hash="ignored",
        status="queued",
        error_message=None,
        created_at=datetime.now(timezone.utc),
        updated_at=None,
    )
    stub_repo = StubDocumentRepository(created_document=created)

    response = await upload_document(
        file=build_upload_file("doc.txt", b"hello world", "text/plain"),
        document_repo=stub_repo,
    )

    assert response.id == str(created.id)
    assert response.filename == "doc.txt"
    assert response.status == "queued"
    assert len(stub_repo.create_calls) == 1
    _, commit = stub_repo.create_calls[0]
    assert commit is True
