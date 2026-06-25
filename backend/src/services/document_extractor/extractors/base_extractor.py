from abc import ABC, abstractmethod

from src.core.config import settings

from openai import OpenAI


class BaseExtractor(ABC):
    def __init__(self):
        self.llm_client, self.llm_model = self._build_llm_client()

    def _build_llm_client(self) -> tuple[object | None, str]:
        if settings.LLM_PROVIDER == "gemini":
            return (
                OpenAI(
                    api_key=settings.GEMINI_API_KEY,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                ),
                settings.GEMINI_MODEL,
            )
        return (
            OpenAI(api_key=settings.OPENAI_API_KEY),
            settings.OPENAI_MODEL,
        )

    @abstractmethod
    async def extract(self, content: bytes, filename: str) -> str:
        pass
