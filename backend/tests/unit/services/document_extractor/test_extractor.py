from unittest.mock import AsyncMock, MagicMock

import pytest

from src.services.document_extractor.extractor import DocumentExtractor


@pytest.mark.asyncio
async def test_document_extractor_delegates_to_factory_extractor(mocker):
    fake_extractor = AsyncMock()
    fake_extractor.extract.return_value = "normalized text"
    get_extractor = mocker.patch(
        "src.services.document_extractor.extractor.get_extractor",
        return_value=fake_extractor,
    )

    service = DocumentExtractor()
    result = await service.extract(b"hello", "notes.txt")

    assert result == "normalized text"
    get_extractor.assert_called_once_with(".txt")
    fake_extractor.extract.assert_awaited_once_with(b"hello", "notes.txt")
