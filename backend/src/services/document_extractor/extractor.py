from pathlib import Path

from loguru import logger

from src.services.document_extractor.extractors.extractor_factory import get_extractor


class DocumentExtractor:
    async def extract(self, content: bytes, filename: str) -> str:
        try:
            ext = Path(filename).suffix
            log = logger.bind(service="document_extractor", filename=filename, ext=ext)

            log.debug(f"Starting extraction for document '{filename}'")

            extractor = get_extractor(ext)
            text = await extractor.extract(content, filename)

            log.info(f"Extraction completed | chars={len(text)}")

            return text

        except Exception as exc:
            log.exception(f"Failed to extract text from document '{filename}'. Error: {str(exc)}")
            raise
