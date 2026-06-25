from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from datetime import datetime, timezone
from uuid import UUID

from loguru import logger

from src.db.database import db
from src.repositories.documents import DocumentRepository, DocumentUpdate
from src.services.rag_pipeline.pipeline import RagPipeline

SUPPORTED_EXTENSIONS = (".txt", ".md", ".pdf")

SessionFactory = Callable[[], AbstractAsyncContextManager]
RepositoryFactory = Callable[[object], DocumentRepository]


async def _update_document_status(
    *,
    document_id: UUID,
    status: str,
    error_message: str | None = None,
    session_factory: SessionFactory | None = None,
    repository_factory: RepositoryFactory | None = None,
) -> None:
    session_factory = session_factory or db.session
    repository_factory = repository_factory or (lambda session: DocumentRepository(session=session))

    async with session_factory() as session:
        repo = repository_factory(session)
        await repo.update(
            document_id,
            DocumentUpdate(
                status=status,
                error_message=error_message,
                updated_at=datetime.now(timezone.utc),
            ),
        )


async def run_pipeline_background(
    *,
    document_id: UUID,
    filename: str,
    content: bytes,
    pipeline: RagPipeline | None = None,
    session_factory: SessionFactory | None = None,
    repository_factory: RepositoryFactory | None = None,
):
    pipeline = pipeline or RagPipeline()
    log = logger.bind(
        service="documents_background_pipeline",
        document_id=str(document_id),
        filename=filename,
    )

    await _update_document_status(
        document_id=document_id,
        status="processing",
        session_factory=session_factory,
        repository_factory=repository_factory,
    )

    try:
        result = await pipeline.run(
            document_id=document_id,
            filename=filename,
            content=content,
        )
    except Exception as exc:
        error_message = str(exc)
        log.exception(f"Background ingestion failed for '{filename}'. Error: {error_message}")
        await _update_document_status(
            document_id=document_id,
            status="failed",
            error_message=error_message,
            session_factory=session_factory,
            repository_factory=repository_factory,
        )
        return None

    await _update_document_status(
        document_id=document_id,
        status="completed",
        error_message=None,
        session_factory=session_factory,
        repository_factory=repository_factory,
    )
    log.info(
        f"Background ingestion completed for '{filename}' | "
        f"chunks={result.chunk_count} stored={result.stored_count}"
    )
    return result
