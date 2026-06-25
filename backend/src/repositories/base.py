from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import Base, db

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
FiltersSchemaType = TypeVar("FiltersSchemaType", bound=BaseModel)


class BaseRepository(
    ABC,
    Generic[ModelType, CreateSchemaType, UpdateSchemaType, FiltersSchemaType],
):
    def __init__(self, session: AsyncSession = Depends(db)) -> None:
        self.session = session

    @abstractmethod
    async def create(self, data: CreateSchemaType) -> ModelType:
        pass

    @abstractmethod
    async def get_by_id(self, id) -> ModelType | None:
        pass

    @abstractmethod
    async def get_all(self, filters: FiltersSchemaType | None = None) -> list[ModelType]:
        pass

    @abstractmethod
    async def update(self, id, data: UpdateSchemaType) -> ModelType:
        pass

    @abstractmethod
    async def delete(self, id) -> bool:
        pass
