"""Miscellaneous and health-check endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ..settings.config import settings
from ..db.database import get_db

router = APIRouter()


@router.get("/", tags=["Root"])
async def read_root():
    """Dummy root endpoint to verify API is running."""
    return {"message": f"Welcome to the {settings.app_name} 🚀"}


@router.get("/ping", tags=["Health"])
async def ping():
    """Health-check endpoint."""
    return {"ping": "pong"}


@router.get("/hello/{name}", tags=["Example"])
async def say_hello(name: str):
    """Return a personalised greeting."""
    return {"message": f"Hello, {name}!"}


@router.get("/items/{item_id}", tags=["Example"])
async def read_item(item_id: int, db: Session = Depends(get_db)):
    """Example endpoint showing dependency injection of DB session.

    Currently returns a stubbed response and does not interact with any tables.
    """
    return {"item_id": item_id, "note": "This is a stub. No database interaction yet."}


@router.get("/api/test", tags=["Health"])
async def api_test():
    """Simple endpoint for frontend connectivity testing."""
    return {"status": "ok"}
