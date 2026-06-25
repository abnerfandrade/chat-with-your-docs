from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from src.agents.state import ChatGraphState
from src.agents.guardrails import guardrails_node
from src.agents.answer_agent import answer_agent_node


def route_after_guardrails(state: ChatGraphState) -> str:
    decision = state.get("guardrails_decision")
    if decision is None:
        raise ValueError("guardrails_decision is required before routing the chat graph")

    if decision.verdict == "allow":
        return "answer_agent_node"

    if decision.verdict in {"refuse", "needs_clarification"}:
        return END

    raise ValueError(f"Unsupported guardrails verdict: '{decision.verdict}'")


@lru_cache(maxsize=1)
def get_chat_graph():
    graph = StateGraph(ChatGraphState)

    graph.add_node("guardrails_node", guardrails_node)
    graph.add_node("answer_agent_node", answer_agent_node)

    graph.add_edge(START, "guardrails_node")
    graph.add_conditional_edges("guardrails_node", route_after_guardrails)
    graph.add_edge("answer_agent_node", END)

    return graph.compile()
