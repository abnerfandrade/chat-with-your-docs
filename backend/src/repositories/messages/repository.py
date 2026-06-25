import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.models import Message
from src.repositories.base import BaseRepository
from src.repositories.messages.datatypes import (
    MessageCreate,
    MessageFilters,
    MessageUpdate,
)
from src.repositories.messages.exceptions import (
    MessageCreateError,
    MessageDeleteError,
    MessageNotFoundError,
    MessageUpdateError,
)


class MessageRepository(
    BaseRepository[Message, MessageCreate, MessageUpdate, MessageFilters]
):
    async def create(self, data: MessageCreate) -> Message:
        try:
            message = Message(**data.model_dump())

            self.session.add(message)
            await self.session.flush()
            await self.session.refresh(message)

            return message
        except Exception as exc:
            raise MessageCreateError(f"Error creating message: {exc}") from exc

    async def get_by_id(self, id: uuid.UUID) -> Message | None:
        try:
            query = select(Message).where(Message.id == id)
            result = await self.session.execute(query)

            return result.scalar_one_or_none()
        except Exception as exc:
            raise Exception(f"Error fetching message {id}: {exc}") from exc

    async def get_all(self, filters: MessageFilters | None = None) -> list[Message]:
        try:
            query = select(Message).options(selectinload(Message.chat))

            if filters:
                filter_map = {
                    "chat_id": lambda v: query.where(Message.chat_id == v),
                    "role": lambda v: query.where(Message.role == v),
                    "created_after": lambda v: query.where(Message.created_at >= v),
                    "created_before": lambda v: query.where(Message.created_at <= v),
                }
                for field, apply_filter in filter_map.items():
                    value = getattr(filters, field, None)
                    if value is not None:
                        query = apply_filter(value)

            result = await self.session.execute(query)

            return list(result.scalars().all())
        except Exception as exc:
            raise Exception(f"Error fetching messages: {exc}") from exc

    async def get_by_chat_id(self, chat_id: uuid.UUID) -> list[Message]:
        try:
            query = (
                select(Message)
                .where(Message.chat_id == chat_id)
                .order_by(Message.created_at.asc())
            )
            result = await self.session.execute(query)

            return list(result.scalars().all())
        except Exception as exc:
            raise Exception(f"Error fetching messages for chat {chat_id}: {exc}") from exc

    async def update(self, id: uuid.UUID, data: MessageUpdate) -> Message:
        try:
            message = await self.get_by_id(id)
            if message is None:
                raise MessageNotFoundError(f"Message {id} not found")

            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(message, field, value)

            await self.session.flush()
            await self.session.refresh(message)

            return message
        except MessageNotFoundError:
            raise
        except Exception as exc:
            raise MessageUpdateError(f"Error updating message {id}: {exc}") from exc

    async def delete(self, id: uuid.UUID) -> bool:
        try:
            message = await self.get_by_id(id)
            if message is None:
                raise MessageNotFoundError(f"Message {id} not found")

            await self.session.delete(message)
            await self.session.flush()

            return True
        except MessageNotFoundError:
            raise
        except Exception as exc:
            raise MessageDeleteError(f"Error deleting message {id}: {exc}") from exc
