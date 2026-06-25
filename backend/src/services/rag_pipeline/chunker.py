from functools import lru_cache

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger

from src.core.config import settings
from src.services.rag_pipeline.datatypes import ChunkDocument, ChunkMetadata


@lru_cache(maxsize=1)
def _get_encoding():
    try:
        return tiktoken.get_encoding("cl100k_base")
    except Exception as exc:
        logger.warning(
            f"Failed to load tiktoken encoding 'cl100k_base'. "
            f"Falling back to character length. Error: {str(exc)}"
        )
        return None


def _tiktoken_len(text: str) -> int:
    encoding = _get_encoding()
    if encoding is None:
        return len(text)
    return len(encoding.encode(text))


class TokenChunker:
    def __init__(
        self,
        chunk_size_tokens: int | None = None,
        chunk_overlap_tokens: int | None = None,
    ):
        self.chunk_size_tokens = chunk_size_tokens or settings.CHUNK_SIZE_TOKENS
        self.chunk_overlap_tokens = (
            chunk_overlap_tokens or settings.CHUNK_OVERLAP_TOKENS
        )
        self.logger = logger.bind(
            service="chunker",
            chunk_size_tokens=self.chunk_size_tokens,
            chunk_overlap_tokens=self.chunk_overlap_tokens,
        )
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size_tokens,
            chunk_overlap=self.chunk_overlap_tokens,
            length_function=_tiktoken_len,
            separators=["\n\n", "\n", " ", ""],
        )

    def chunk(self, text: str, source: str, document_id) -> list[ChunkDocument]:
        if not text or not text.strip():
            raise ValueError(
                f"Empty text cannot be chunked (source='{source}', document_id='{document_id}')"
            )

        try:
            raw_chunks = self._splitter.split_text(text)
            if not raw_chunks:
                raise ValueError(
                    f"No chunks were generated for source='{source}' "
                    f"(chars={len(text)}, document_id='{document_id}')"
                )

            total_chunks = len(raw_chunks)
            chunks = [
                ChunkDocument(
                    content=chunk,
                    metadata=ChunkMetadata(
                        document_id=document_id,
                        source=source,
                        chunk_id=f"{document_id}::chunk::{index}",
                        chunk_index=index,
                        total_chunks=total_chunks,
                    ),
                )
                for index, chunk in enumerate(raw_chunks)
            ]

            self.logger.info(
                f"{len(chunks)} chunks created for '{source}' "
                f"(document_id='{document_id}')"
            )
            return chunks
        except Exception as exc:
            self.logger.exception(
                f"Failed to chunk text for '{source}' "
                f"(document_id='{document_id}'). Error: {str(exc)}"
            )
            raise
