from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db

# Ensure all tables are created (no-op if none exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/", tags=["Root"])
async def read_root():
    """Dummy root endpoint to verify API is running."""
    return {"message": f"Welcome to the {settings.app_name} 🚀"}


@app.get("/ping", tags=["Health"])
async def ping():
    """Healthcheck endpoint."""
    return {"ping": "pong"}


@app.get("/hello/{name}", tags=["Example"])
async def say_hello(name: str):
    """Return a personalized greeting."""
    return {"message": f"Hello, {name}!"}


@app.get("/items/{item_id}", tags=["Example"])
async def read_item(item_id: int, db: Session = Depends(get_db)):
    """Example endpoint showing dependency injection of DB session.

    Currently returns a stubbed response and does not interact with any tables.
    """
    return {"item_id": item_id, "note": "This is a stub. No database interaction yet."} 