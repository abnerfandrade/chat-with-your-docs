import io
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.services.document_extractor.extractors.text_extractor import TextExtractor


def test_text_extractor_extract_sync_uses_markitdown(mocker):
    fake_markitdown_instance = mocker.Mock()
    fake_markitdown_instance.convert_stream.return_value = SimpleNamespace(
        text_content="converted text"
    )
    mocker.patch(
        "src.services.document_extractor.extractors.text_extractor.MarkItDown",
        return_value=fake_markitdown_instance,
    )

    extractor = TextExtractor()
    result = extractor.extract_sync(b"hello", "notes.md")

    assert result == "converted text"
    fake_markitdown_instance.convert_stream.assert_called_once()
    _, kwargs = fake_markitdown_instance.convert_stream.call_args
    assert kwargs["file_extension"] == ".md"
    assert isinstance(fake_markitdown_instance.convert_stream.call_args.args[0], io.BytesIO)


@pytest.mark.asyncio
async def test_text_extractor_extract_runs_sync_work_in_thread(mocker):
    fake_markitdown_instance = mocker.Mock()
    mocker.patch(
        "src.services.document_extractor.extractors.text_extractor.MarkItDown",
        return_value=fake_markitdown_instance,
    )
    to_thread = mocker.patch(
        "src.services.document_extractor.extractors.text_extractor.asyncio.to_thread",
        new=AsyncMock(return_value="thread result"),
    )

    extractor = TextExtractor()
    result = await extractor.extract(b"hello", "notes.txt")

    assert result == "thread result"
    to_thread.assert_awaited_once()


def test_text_extractor_initializes_markitdown_once(mocker):
    ctor = mocker.patch(
        "src.services.document_extractor.extractors.text_extractor.MarkItDown",
        return_value=mocker.Mock(),
    )
    extractor = TextExtractor()

    assert extractor.md is not None
    ctor.assert_called_once_with()
