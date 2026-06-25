from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings


class Base(AsyncAttrs, DeclarativeBase):
    pass


class Database:
    def __init__(self) -> None:
        self._engine = create_async_engine(settings.DATABASE_URL, echo=False)
        self.async_sessionmaker = async_sessionmaker(
            bind=self._engine,
            expire_on_commit=False,
        )

    @property
    def engine(self):
        return self._engine

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.async_sessionmaker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def __call__(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session() as session:
            yield session


db = Database()
