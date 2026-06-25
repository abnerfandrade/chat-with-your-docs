import asyncio
import io
from textwrap import dedent

import fitz
from markitdown import MarkItDown
from loguru import logger

from src.services.document_extractor.extractors.base_extractor import BaseExtractor


_OCR_PROMPT = dedent("""
    You are an OCR assistant specialized in extracting text from images.
    Your task is to transcribe all visible content faithfully into structured Markdown.
    Rules:
    - Preserve the original language of the content.
    - Transcribe all visible data without omission.
    - Use Markdown tables when tabular data exists.
    - Do not add interpretations or comments.
""").strip()


class PdfExtractor(BaseExtractor):
    def __init__(self):
        super().__init__()
        self.md = MarkItDown()
        self.md_ocr = MarkItDown(
            llm_client=self.llm_client,
            llm_model=self.llm_model,
            llm_prompt=_OCR_PROMPT,
        )

    async def extract(self, content: bytes, filename: str) -> str:
        return await asyncio.to_thread(self._extract_sync, content, filename)

    def _extract_sync(self, content: bytes, filename: str) -> str:
        log = logger.bind(service="pdf_extractor", filename=filename)
        doc = None

        try:
            doc = fitz.open(stream=content, filetype="pdf")
            return self._process(doc, content, log)
        except Exception as exc:
            log.error(f"Failed to extract text from PDF '{filename}'. Error: {str(exc)}")
            raise
        finally:
            if doc is not None:
                doc.close()

    def _process(self, doc, raw: bytes, log) -> str:
        try:
            total_images = sum(len(doc.get_page_images(i)) for i in range(doc.page_count))

            log.debug(
                f"PDF analysis | pages={doc.page_count} images_total={total_images}"
            )

            if total_images == 0:
                log.debug("Strategy: text-only extraction")
                return self._extract_text_only(raw, log)
            if total_images > doc.page_count:
                log.debug("Strategy: page render OCR")
                return self._extract_by_page_render(doc, log)

            log.debug("Strategy: inline OCR")
            return self._extract_with_inline_ocr(doc, log)
        except Exception as exc:
            log.error(f"Failed to process PDF: {str(exc)}")
            raise

    def _extract_text_only(self, content: bytes, log) -> str:
        try:
            result = self.md.convert_stream(io.BytesIO(content), file_extension=".pdf")
            log.debug(f"Text-only extraction completed | chars={len(result.text_content)}")
            return result.text_content
        except Exception as exc:
            log.error(f"MarkItDown failed during text-only extraction: {str(exc)}")
            raise

    def _extract_by_page_render(self, doc, log) -> str:
        try:
            texts: list[str] = []

            for i in range(doc.page_count):
                log.debug(f"Rendering page {i + 1}/{doc.page_count} for OCR")
                page = doc.load_page(i)
                pixmap = page.get_pixmap(dpi=200)
                text = self._ocr_image(pixmap.tobytes("png"), ".png", log)
                texts.append(text)

            if not texts:
                log.error("All pages failed during page-render OCR extraction")

            return "\n\n".join(texts)
        except Exception as exc:
            log.error(f"Failed page-render OCR extraction: {str(exc)}")
            raise

    def _extract_with_inline_ocr(self, doc, log) -> str:
        try:
            pages: list[str] = []
            for i in range(doc.page_count):
                log.debug(f"Processing page {i + 1}/{doc.page_count} with inline OCR")
                pages.append(self._extract_page_with_inline_ocr(doc, doc.load_page(i), log))

            return "\n\n".join(pages)
        except Exception as exc:
            log.error(f"Failed inline OCR extraction: {str(exc)}")
            raise

    def _extract_page_with_inline_ocr(self, doc, page, log) -> str:
        try:
            entries: list[tuple[float, float, str, object]] = []

            for block in page.get_text("blocks"):
                x0, y0, _x1, _y1, text, _block_no, block_type = block
                if block_type == 0 and text.strip():
                    entries.append((y0, x0, "text", text.strip()))

            seen: set[tuple[int, str]] = set()
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                for rect in page.get_image_rects(xref):
                    key = (xref, str(rect))
                    if key in seen:
                        continue
                    seen.add(key)
                    entries.append((rect.y0, rect.x0, "image", xref))

            entries.sort(key=lambda e: (e[0], e[1]))

            parts: list[str] = []
            for _y, _x, kind, value in entries:
                if kind == "text":
                    parts.append(str(value))
                else:
                    ocr_text = self._ocr_image_by_xref(doc, int(value), log)
                    if ocr_text.strip():
                        parts.append(ocr_text.strip())

            return "\n".join(parts)
        except Exception as exc:
            log.error(f"Failed to process page with inline OCR: {str(exc)}")
            raise

    def _ocr_image_by_xref(self, doc, xref: int, log) -> str:
        try:
            image_data = doc.extract_image(xref)
            ext = f".{image_data['ext']}"
            return self._ocr_image(image_data["image"], ext, log)
        except Exception as exc:
            log.warning(f"Failed to extract image xref={xref}: {str(exc)}")
            return ""

    def _ocr_image(self, image_bytes: bytes, ext: str, log) -> str:
        try:
            result = self.md_ocr.convert_stream(io.BytesIO(image_bytes), file_extension=ext)
            log.debug(f"OCR result | ext={ext} chars={len(result.text_content)}")
            return result.text_content
        except Exception as exc:
            log.warning(f"OCR failed for image ext={ext}: {str(exc)}")
            raise
