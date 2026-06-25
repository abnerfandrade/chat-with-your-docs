from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from loguru import logger

from src.core.config import settings


@lru_cache(maxsize=1)
def get_llm():
    if settings.LLM_PROVIDER == "gemini":
        logger.debug(
            f"Initializing Gemini chat model | model='{settings.GEMINI_MODEL}'"
        )
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=2,
        )

    if settings.LLM_PROVIDER == "openai":
        logger.debug(
            f"Initializing OpenAI chat model | model='{settings.OPENAI_MODEL}'"
        )
        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=2,
        )

    raise ValueError(f"Unsupported LLM provider: '{settings.LLM_PROVIDER}'")
