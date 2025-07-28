from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from ..services.pandas_service import query_pandas_agent

router = APIRouter()

class GameContext(BaseModel):
    game_date: str = Field(..., description="Game date in YYYY-MM-DD format")
    home_team: str
    away_team: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    messages: List[ChatMessage]
    game: GameContext

@router.post("/chat")
async def chat_with_pandas(chat_input: ChatInput):
    """
    Handles chat requests by forwarding the last user message to the pandas agent, scoped to the provided game context.
    """
    last_user_message = None
    for message in reversed(chat_input.messages):
        if message.role == 'user':
            last_user_message = message.content
            break

    if not last_user_message:
        return {"role": "assistant", "content": "No user message found."}

    game_ctx = chat_input.game.model_dump()

    response = query_pandas_agent(last_user_message, game_ctx)
    return {"role": "assistant", "content": response}