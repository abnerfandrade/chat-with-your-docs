import uuid

from sqlalchemy import select

from src.db.models import Document
from src.repositories.base import BaseRepository
from src.repositories.documents.datatypes import (
    DocumentCreate,
    DocumentFilters,
    DocumentUpdate,
)
from src.repositories.documents.exceptions import (
    DocumentCreateError,
    DocumentDeleteError,
    DocumentNotFoundError,
    DocumentUpdateError,
)


class DocumentRepository(
    BaseRepository[Document, DocumentCreate, DocumentUpdate, DocumentFilters]
):
    async def create(self, data: DocumentCreate, *, commit: bool = False) -> Document:
        try:
            document = Document(**data.model_dump())

            self.session.add(document)
            await self.session.flush()
            await self.session.refresh(document)

            if commit:
                await self.session.commit()

            return document
        except Exception as exc:
            raise DocumentCreateError(f"Error creating document: {exc}") from exc

    async def get_by_hash(self, file_hash: str) -> Document | None:
        try:
            query = select(Document).where(Document.file_hash == file_hash)
            result = await self.session.execute(query)

            return result.scalar_one_or_none()
        except Exception as exc:
            raise Exception(f"Error fetching document by hash: {exc}") from exc

    async def get_by_id(self, id: uuid.UUID) -> Document | None:
        try:
            query = select(Document).where(Document.id == id)
            result = await self.session.execute(query)

            return result.scalar_one_or_none()
        except Exception as exc:
            raise Exception(f"Error fetching document {id}: {exc}") from exc

    async def get_all(self, filters: DocumentFilters | None = None) -> list[Document]:
        try:
            query = select(Document)

            if filters:
                filter_map = {
                    "filename": lambda v: query.where(Document.filename.ilike(f"%{v}%")),
                    "status": lambda v: query.where(Document.status == v),
                    "created_after": lambda v: query.where(Document.created_at >= v),
                    "created_before": lambda v: query.where(Document.created_at <= v),
                }
                for field, apply_filter in filter_map.items():
                    value = getattr(filters, field, None)
                    if value is not None:
                        query = apply_filter(value)

            result = await self.session.execute(query)

            return list(result.scalars().all())
        except Exception as exc:
            raise Exception(f"Error fetching documents: {exc}") from exc

    async def update(self, id: uuid.UUID, data: DocumentUpdate) -> Document:
        try:
            document = await self.get_by_id(id)
            if document is None:
                raise DocumentNotFoundError(f"Document {id} not found")

            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(document, field, value)

            await self.session.flush()
            await self.session.refresh(document)

            return document
        except DocumentNotFoundError:
            raise
        except Exception as exc:
            raise DocumentUpdateError(f"Error updating document {id}: {exc}") from exc

    async def delete(self, id: uuid.UUID) -> bool:
        try:
            document = await self.get_by_id(id)
            if document is None:
                raise DocumentNotFoundError(f"Document {id} not found")

            await self.session.delete(document)
            await self.session.flush()

            return True
        except DocumentNotFoundError:
            raise
        except Exception as exc:
            raise DocumentDeleteError(f"Error deleting document {id}: {exc}") from exc
