import asyncio
import io
from pathlib import Path

from markitdown import MarkItDown

from src.core.logger import logger
from src.services.document_extractor.extractors.base_extractor import BaseExtractor



class TextExtractor(BaseExtractor):
    def __init__(self):
        super().__init__()
        self.md = MarkItDown()

    async def extract(self, content: bytes, filename: str) -> str:
        return await asyncio.to_thread(self.extract_sync, content, filename)

    def extract_sync(self, content: bytes, filename: str) -> str:
        log = logger.bind(service="text_extractor", filename=filename)

        try:
            log.debug(f"Starting text extraction for file '{filename}'")

            ext = Path(filename).suffix
            result = self.md.convert_stream(io.BytesIO(content), file_extension=ext)

            log.debug(f"Text extraction completed | chars={len(result.text_content)}")
            return result.text_content

        except Exception as exc:
            log.exception(f"Failed to extract text from file '{filename}'. Error: {str(exc)}")
            raise
