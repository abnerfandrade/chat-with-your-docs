from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "production"] = Field(default="development")
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/chat_with_your_docs"
    )

    LLM_PROVIDER: Literal["gemini", "openai"] = Field(default="openai")

    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-5-mini")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")

    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")
    GEMINI_EMBEDDING_MODEL: str = Field(default="gemini-embedding-001")

    QDRANT_URL: str = Field(default="http://localhost:6333")
    QDRANT_COLLECTION_NAME: str = Field(default="chat_with_your_docs")
    QDRANT_VECTOR_SIZE: int = Field(default=1536)

    CHUNK_SIZE_TOKENS: int = Field(default=1000)
    CHUNK_OVERLAP_TOKENS: int = Field(default=150)
    MAX_UPLOAD_SIZE_MB: int = Field(default=10)
    CORS_ALLOW_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    ANSWER_AGENT_MAX_TOOL_CALLS: int = Field(default=3)
    ANSWER_AGENT_MAX_MODEL_CALLS: int = Field(default=4)


settings = Settings()
