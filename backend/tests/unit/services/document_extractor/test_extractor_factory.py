import pytest

from src.services.document_extractor.extractors.extractor_factory import get_extractor
from src.services.document_extractor.extractors.pdf_extractor import PdfExtractor
from src.services.document_extractor.extractors.text_extractor import TextExtractor


@pytest.mark.parametrize(
    ("extension", "expected_class"),
    [
        (".txt", TextExtractor),
        (".md", TextExtractor),
        (".pdf", PdfExtractor),
    ],
)
def test_get_extractor_returns_expected_class(extension, expected_class, mocker):
    mocker.patch.object(expected_class, "__init__", return_value=None)

    extractor = get_extractor(extension)

    assert isinstance(extractor, expected_class)


def test_get_extractor_raises_for_unsupported_extension():
    with pytest.raises(ValueError, match="Unsupported extension"):
        get_extractor(".csv")
