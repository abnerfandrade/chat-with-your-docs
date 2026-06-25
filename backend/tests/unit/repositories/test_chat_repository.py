import uuid
from unittest.mock import MagicMock

import pytest

from src.db.models import Chat
from src.repositories.chats.datatypes import ChatCreate, ChatFilters, ChatUpdate
from src.repositories.chats.exceptions import ChatNotFoundError
from src.repositories.chats.repository import ChatRepository


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
async def test_chat_repository_create_and_get_by_id(mock_session):
    repository = ChatRepository(mock_session)
    chat = Chat(id=uuid.uuid4(), title="First chat")
    mock_session.refresh.side_effect = lambda instance: None

    created = await repository.create(ChatCreate(title="First chat"))
    created.id = chat.id

    mock_session.execute.return_value = _scalar_result(created)
    found = await repository.get_by_id(created.id)

    assert found is not None
    assert found.id == created.id
    assert found.title == "First chat"
    mock_session.add.assert_called_once()


@pytest.mark.asyncio
async def test_chat_repository_get_all_with_filters(mock_session):
    repository = ChatRepository(mock_session)
    chats = [Chat(id=uuid.uuid4(), title="RAG notes")]
    mock_session.execute.return_value = _list_result(chats)

    results = await repository.get_all(ChatFilters(title="RAG"))

    assert len(results) == 1
    assert results[0].title == "RAG notes"
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_chat_repository_update(mock_session):
    repository = ChatRepository(mock_session)
    chat = Chat(id=uuid.uuid4(), title="Old title")
    mock_session.execute.return_value = _scalar_result(chat)

    updated = await repository.update(chat.id, ChatUpdate(title="New title"))

    assert updated.title == "New title"
    mock_session.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_chat_repository_delete(mock_session):
    repository = ChatRepository(mock_session)
    chat = Chat(id=uuid.uuid4(), title="Delete me")
    mock_session.execute.return_value = _scalar_result(chat)

    deleted = await repository.delete(chat.id)

    assert deleted is True
    mock_session.delete.assert_awaited_once_with(chat)


@pytest.mark.asyncio
async def test_chat_repository_update_missing_raises(mock_session):
    repository = ChatRepository(mock_session)
    missing_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
    mock_session.execute.return_value = _scalar_result(None)

    with pytest.raises(ChatNotFoundError):
        await repository.update(missing_id, ChatUpdate(title="Missing"))
