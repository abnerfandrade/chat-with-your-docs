import hashlib

from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, UploadFile

from src.core.config import settings
from src.repositories.documents import DocumentCreate, DocumentRepository
from src.routes.documents.datatypes import DocumentResponse, UploadResponse
from src.routes.documents.service import SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/documents", tags=["documents"])


def init_app(app: FastAPI) -> None:
    app.include_router(router)


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    document_repo: DocumentRepository = Depends(DocumentRepository),
) -> list[DocumentResponse]:
    documents = await document_repo.get_all()
    documents = sorted(documents, key=lambda item: item.created_at, reverse=True)

    return [
        DocumentResponse(
            id=str(document.id),
            filename=document.filename,
            content_type=document.content_type,
            size_bytes=document.size_bytes,
            status=document.status,
            error_message=document.error_message,
            created_at=document.created_at,
            updated_at=document.updated_at,
        )
        for document in documents
    ]


@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    document_repo: DocumentRepository = Depends(DocumentRepository),
) -> UploadResponse:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    ext = f".{ext}" if ext else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Extension '{ext}' is not supported. "
                f"Supported extensions: {', '.join(SUPPORTED_EXTENSIONS)}"
            ),
        )

    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File '{filename}' exceeds the maximum size "
                f"of {settings.MAX_UPLOAD_SIZE_MB}MB."
            ),
        )

    file_hash = hashlib.sha256(content).hexdigest()
    existing = await document_repo.get_by_hash(file_hash)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"A document with the same content was already uploaded "
                f"(id={existing.id}, filename='{existing.filename}')."
            ),
        )

    created = await document_repo.create(
        DocumentCreate(
            filename=filename,
            content_type=file.content_type,
            size_bytes=len(content),
            file_hash=file_hash,
            status="queued",
        ),
        commit=True,
    )

    return UploadResponse(
        id=str(created.id),
        filename=created.filename,
        status=created.status,
    )
