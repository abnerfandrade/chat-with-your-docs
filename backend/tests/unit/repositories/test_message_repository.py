import uuid
from unittest.mock import MagicMock

import pytest

from src.db.models import Message
from src.repositories.messages.datatypes import (
    MessageCreate,
    MessageFilters,
    MessageUpdate,
)
from src.repositories.messages.exceptions import MessageNotFoundError
from src.repositories.messages.repository import MessageRepository


def _scalar_result(value):
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


def _list_result(values):
    result = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = values
    result.scalars.return_value = scalars
    return result


@pytest.mark.asyncio
async def test_message_repository_create_and_get_by_id(mock_session):
    repository = MessageRepository(mock_session)

    created = await repository.create(
        MessageCreate(chat_id=uuid.uuid4(), role="user", content="Hello")
    )
    created.id = uuid.uuid4()
    mock_session.execute.return_value = _scalar_result(created)

    found = await repository.get_by_id(created.id)

    assert found is not None
    assert found.id == created.id
    assert found.content == "Hello"


@pytest.mark.asyncio
async def test_message_repository_get_by_chat_id_orders_messages(mock_session):
    repository = MessageRepository(mock_session)
    chat_id = uuid.uuid4()
    messages = [
        Message(id=uuid.uuid4(), chat_id=chat_id, role="user", content="First"),
        Message(id=uuid.uuid4(), chat_id=chat_id, role="assistant", content="Second"),
    ]
    mock_session.execute.return_value = _list_result(messages)

    results = await repository.get_by_chat_id(chat_id)

    assert len(results) == 2
    assert results[0].content == "First"
    assert results[1].content == "Second"


@pytest.mark.asyncio
async def test_message_repository_get_all_with_filters(mock_session):
    repository = MessageRepository(mock_session)
    messages = [
        Message(id=uuid.uuid4(), chat_id=uuid.uuid4(), role="assistant", content="Answer")
    ]
    mock_session.execute.return_value = _list_result(messages)

    results = await repository.get_all(MessageFilters(role="assistant"))

    assert len(results) == 1
    assert results[0].role == "assistant"


@pytest.mark.asyncio
async def test_message_repository_update(mock_session):
    repository = MessageRepository(mock_session)
    message = Message(
        id=uuid.uuid4(),
        chat_id=uuid.uuid4(),
        role="assistant",
        content="Old",
    )
    mock_session.execute.return_value = _scalar_result(message)

    updated = await repository.update(
        message.id,
        MessageUpdate(content="New"),
    )

    assert updated.content == "New"


@pytest.mark.asyncio
async def test_message_repository_delete(mock_session):
    repository = MessageRepository(mock_session)
    message = Message(
        id=uuid.uuid4(),
        chat_id=uuid.uuid4(),
        role="assistant",
        content="Delete me",
    )
    mock_session.execute.return_value = _scalar_result(message)

    deleted = await repository.delete(message.id)

    assert deleted is True
    mock_session.delete.assert_awaited_once_with(message)


@pytest.mark.asyncio
async def test_message_repository_update_missing_raises(mock_session):
    repository = MessageRepository(mock_session)
    missing_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
    mock_session.execute.return_value = _scalar_result(None)

    with pytest.raises(MessageNotFoundError):
        await repository.update(
            missing_id,
            MessageUpdate(content="Missing"),
        )
