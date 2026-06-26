from typing import Literal

from pydantic import BaseModel, Field


class GuardrailsDecision(BaseModel):
    verdict: Literal["allow", "refuse"] = Field(
        ...,
        description="Guardrails verdict for the latest user message",
    )
    reason: str = Field(
        ...,
        description="Short explanation for why the verdict was selected",
    )
    message_to_user: str | None = Field(
        default=None,
        description="Optional user-facing refusal or clarification message",
    )
