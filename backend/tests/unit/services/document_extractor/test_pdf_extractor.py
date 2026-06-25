from types import SimpleNamespace

import pytest

from src.services.document_extractor.extractors.pdf_extractor import PdfExtractor


class FakeDoc:
    def __init__(self, page_count=1, image_counts=None):
        self.page_count = page_count
        self._image_counts = image_counts or [0]
        self.closed = False

    def get_page_images(self, index):
        return [object()] * self._image_counts[index]

    def close(self):
        self.closed = True


def _patch_pdf_dependencies(mocker):
    fake_markitdown_instances = [
        mocker.Mock(convert_stream=mocker.Mock(return_value=SimpleNamespace(text_content="text result"))),
        mocker.Mock(convert_stream=mocker.Mock(return_value=SimpleNamespace(text_content="ocr result"))),
    ]
    markitdown_ctor = mocker.patch(
        "src.services.document_extractor.extractors.pdf_extractor.MarkItDown",
        side_effect=fake_markitdown_instances,
    )
    return markitdown_ctor, fake_markitdown_instances


def test_pdf_extractor_text_only_strategy_uses_markitdown(mocker):
    _patch_pdf_dependencies(mocker)
    fake_doc = FakeDoc(page_count=2, image_counts=[0, 0])
    fitz_open = mocker.patch(
        "src.services.document_extractor.extractors.pdf_extractor.fitz.open",
        return_value=fake_doc,
    )

    extractor = PdfExtractor()
    result = extractor._extract_sync(b"%PDF", "doc.pdf")

    assert result == "text result"
    fitz_open.assert_called_once()
    assert fake_doc.closed is True


def test_pdf_extractor_process_selects_page_render_when_images_exceed_pages(mocker):
    _patch_pdf_dependencies(mocker)
    extractor = PdfExtractor()
    page_render = mocker.patch.object(extractor, "_extract_by_page_render", return_value="page-render")
    inline = mocker.patch.object(extractor, "_extract_with_inline_ocr", return_value="inline")
    text_only = mocker.patch.object(extractor, "_extract_text_only", return_value="text-only")
    fake_doc = FakeDoc(page_count=1, image_counts=[2])

    result = extractor._process(fake_doc, b"%PDF", mocker.Mock())

    assert result == "page-render"
    page_render.assert_called_once()
    inline.assert_not_called()
    text_only.assert_not_called()


def test_pdf_extractor_initializes_text_and_ocr_markitdown_clients(mocker):
    markitdown_ctor, _instances = _patch_pdf_dependencies(mocker)

    extractor = PdfExtractor()

    assert extractor.md is not None
    assert extractor.md_ocr is not None
    assert markitdown_ctor.call_count == 2
    _, second_call_kwargs = markitdown_ctor.call_args_list[1]
    assert "llm_client" in second_call_kwargs
    assert "llm_model" in second_call_kwargs
    assert "llm_prompt" in second_call_kwargs
