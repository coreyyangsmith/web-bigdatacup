from typing import List, Literal
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    """Represents a single chat message exchanged between the user and assistant."""

    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Payload received from the frontend containing the full conversation history."""

    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    """Response returned to the frontend with the assistant's reply."""

    role: Literal["assistant"] = "assistant"
    content: str 