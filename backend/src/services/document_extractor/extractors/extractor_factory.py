from src.services.document_extractor.extractors.base_extractor import BaseExtractor
from src.services.document_extractor.extractors.pdf_extractor import PdfExtractor
from src.services.document_extractor.extractors.text_extractor import TextExtractor

EXTENSIONS: dict[str, type[BaseExtractor]] = {
    ".txt": TextExtractor,
    ".md": TextExtractor,
    ".pdf": PdfExtractor,
}


def get_extractor(extension: str) -> BaseExtractor:
    extractor = EXTENSIONS.get(extension.lower())

    if extractor is None:
        raise ValueError(
            f"Unsupported extension: '{extension}'. Supported: {', '.join(EXTENSIONS.keys())}"
        )

    return extractor()
