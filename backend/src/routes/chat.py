from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..schemas.chat import ChatRequest, ChatMessage

# LangChain & OpenAI imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

router = APIRouter(prefix="/chat", tags=["Chat"])

# Instantiate the model once and reuse for subsequent requests
chat_model = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4.1-nano"),
    temperature=0,
    streaming=True,
)

def _to_lc_message(msg: ChatMessage):
    """Convert pydantic ChatMessage -> LangChain message object."""
    if msg.role == "user":
        return HumanMessage(content=msg.content)
    if msg.role == "assistant":
        return AIMessage(content=msg.content)
    # Defaults to system
    return SystemMessage(content=msg.content)


@router.post("", response_model=None)
async def chat_endpoint(payload: ChatRequest):
    """Stream assistant response back to the client token-by-token."""

    try:
        message_history = [_to_lc_message(m) for m in payload.messages]
        stream_iter = chat_model.stream(message_history)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    def token_generator():
        for chunk in stream_iter:
            if isinstance(chunk, AIMessage):
                # LangChain returns incremental AIMessage chunks with .content containing new tokens
                if chunk.content:
                    yield chunk.content

    # Return streaming plain-text response
    return StreamingResponse(token_generator(), media_type="text/plain")