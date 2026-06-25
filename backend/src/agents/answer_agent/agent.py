from functools import lru_cache

from langchain.agents import create_agent

from src.agents.answer_agent.datatypes import AnswerAgentResult
from src.agents.answer_agent.middlewares import build_answer_agent_middlewares
from src.agents.answer_agent.prompt import SYSTEM_PROMPT
from src.agents.answer_agent.tools import search_documents
from src.agents.llm import get_llm


@lru_cache(maxsize=1)
def get_answer_agent():
    return create_agent(
        model=get_llm(),
        tools=[search_documents],
        middleware=list(build_answer_agent_middlewares()),
        name="answer_agent",
        system_prompt=SYSTEM_PROMPT,
        response_format=AnswerAgentResult,
    )
