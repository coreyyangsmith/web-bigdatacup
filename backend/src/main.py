from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .settings.config import settings
from .db.database import Base, engine, get_db
from .db.seed import reset_and_seed_db
from .models import Event
from .schemas import EventSchema, EventCreate, EventUpdate
from .db import crud

# Initialise logging before anything else
from .utils.logger import logger

# Reset & seed database on startup
reset_and_seed_db()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/test", tags=["Health"])
async def api_test():
    """Simple endpoint for frontend connectivity testing."""
    return {"status": "ok"}


@app.get("/events", response_model=list[EventSchema], tags=["Events"])
async def list_events(limit: int = 100, skip: int = 0, db: Session = Depends(get_db)):
    """Return up to *limit* events from the database for demo purposes."""
    return crud.get_events(db, skip=skip, limit=limit)


# CRUD endpoints


@app.post("/events", response_model=EventSchema, tags=["Events"])
async def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db, event_in)


@app.get("/events/{event_id}", response_model=EventSchema, tags=["Events"])
async def get_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.put("/events/{event_id}", response_model=EventSchema, tags=["Events"])
async def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return crud.update_event(db, event, event_in)


@app.delete("/events/{event_id}", status_code=204, tags=["Events"])
async def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    crud.delete_event(db, event)
    return Response(status_code=204) 