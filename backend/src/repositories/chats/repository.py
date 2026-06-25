import uuid

from sqlalchemy import select

from src.db.models import Chat
from src.repositories.base import BaseRepository
from src.repositories.chats.datatypes import ChatCreate, ChatFilters, ChatUpdate
from src.repositories.chats.exceptions import (
    ChatCreateError,
    ChatDeleteError,
    ChatNotFoundError,
    ChatUpdateError,
)


class ChatRepository(BaseRepository[Chat, ChatCreate, ChatUpdate, ChatFilters]):
    async def create(self, data: ChatCreate) -> Chat:
        try:
            chat = Chat(**data.model_dump())

            self.session.add(chat)
            await self.session.flush()
            await self.session.refresh(chat)

            return chat
        except Exception as exc:
            raise ChatCreateError(f"Error creating chat: {exc}") from exc

    async def get_by_id(self, id: uuid.UUID) -> Chat | None:
        try:
            query = select(Chat).where(Chat.id == id)
            result = await self.session.execute(query)

            return result.scalar_one_or_none()
        except Exception as exc:
            raise Exception(f"Error fetching chat {id}: {exc}") from exc

    async def get_all(self, filters: ChatFilters | None = None) -> list[Chat]:
        try:
            query = select(Chat)

            if filters:
                filter_map = {
                    "title": lambda v: query.where(Chat.title.ilike(f"%{v}%")),
                    "created_after": lambda v: query.where(Chat.created_at >= v),
                    "created_before": lambda v: query.where(Chat.created_at <= v),
                }
                for field, apply_filter in filter_map.items():
                    value = getattr(filters, field, None)
                    if value is not None:
                        query = apply_filter(value)

            query = query.order_by(Chat.created_at.desc())

            result = await self.session.execute(query)

            return list(result.scalars().all())
        except Exception as exc:
            raise Exception(f"Error fetching chats: {exc}") from exc

    async def update(self, id: uuid.UUID, data: ChatUpdate) -> Chat:
        try:
            chat = await self.get_by_id(id)
            if chat is None:
                raise ChatNotFoundError(f"Chat {id} not found")

            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(chat, field, value)

            await self.session.flush()
            await self.session.refresh(chat)

            return chat
        except ChatNotFoundError:
            raise
        except Exception as exc:
            raise ChatUpdateError(f"Error updating chat {id}: {exc}") from exc

    async def delete(self, id: uuid.UUID) -> bool:
        try:
            chat = await self.get_by_id(id)
            if chat is None:
                raise ChatNotFoundError(f"Chat {id} not found")

            await self.session.delete(chat)
            await self.session.flush()

            return True
        except ChatNotFoundError:
            raise
        except Exception as exc:
            raise ChatDeleteError(f"Error deleting chat {id}: {exc}") from exc
