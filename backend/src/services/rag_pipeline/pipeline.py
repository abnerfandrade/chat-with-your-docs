import asyncio
from uuid import UUID

from loguru import logger

from src.services.document_extractor.extractor import DocumentExtractor
from src.services.rag_pipeline.chunker import TokenChunker
from src.services.rag_pipeline.datatypes import RagPipelineResult
from src.services.rag_pipeline.embedder import Embedder


class RagPipeline:
    def __init__(
        self,
        extractor: DocumentExtractor | None = None,
        chunker: TokenChunker | None = None,
        embedder: Embedder | None = None,
    ):
        self.logger = logger.bind(service="rag_pipeline")
        self._extractor = extractor or DocumentExtractor()
        self._chunker = chunker or TokenChunker()
        self._embedder = embedder or Embedder()

    async def run(
        self,
        document_id: UUID,
        content: bytes,
        filename: str,
    ) -> RagPipelineResult:
        bound_logger = self.logger.bind(document_id=str(document_id), filename=filename)
        bound_logger.info(f"Starting RAG pipeline for '{filename}'")

        text = await self.step_extract(content, filename, bound_logger)
        chunks = await self.step_chunk(text, filename, document_id, bound_logger)
        embedding_result = await self.step_embed(chunks, filename, bound_logger)

        result = RagPipelineResult(
            document_id=document_id,
            filename=filename,
            char_count=len(text),
            chunk_count=len(chunks),
            stored_count=embedding_result.stored_count,
        )
        bound_logger.info(
            f"RAG pipeline finished for '{filename}' | "
            f"chars={result.char_count} chunks={result.chunk_count} stored={result.stored_count}"
        )
        return result

    async def step_extract(self, content: bytes, filename: str, log) -> str:
        log.info(f"Extracting document '{filename}'")
        try:
            text = await self._extractor.extract(content, filename)
            log.info(f"Extraction finished for '{filename}' | chars={len(text)}")
            return text
        except Exception as exc:
            log.exception(f"Extraction failed for '{filename}'. Error: {str(exc)}")
            raise RuntimeError(f"Failed to extract document '{filename}': {exc}") from exc

    async def step_chunk(self, text: str, filename: str, document_id: UUID, log):
        log.info(f"Chunking document '{filename}'")
        try:
            chunks = await asyncio.to_thread(
                self._chunker.chunk,
                text,
                source=filename,
                document_id=document_id,
            )
            log.info(f"Chunking finished for '{filename}' | chunks={len(chunks)}")
            return chunks
        except Exception as exc:
            log.exception(f"Chunking failed for '{filename}'. Error: {str(exc)}")
            raise RuntimeError(f"Failed to chunk document '{filename}': {exc}") from exc

    async def step_embed(self, chunks, filename: str, log):
        log.info(f"Embedding/storing chunks for '{filename}'")
        try:
            result = await asyncio.to_thread(self._embedder.embed_and_store, chunks)
            log.info(
                f"Embedding/storage finished for '{filename}' | stored={result.stored_count}"
            )
            return result
        except Exception as exc:
            log.exception(
                f"Embedding/storage failed for '{filename}'. Error: {str(exc)}"
            )
            raise RuntimeError(
                f"Failed to embed/store document '{filename}': {exc}"
            ) from exc
