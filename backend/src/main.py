from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct

from .settings.config import settings
from .db.database import Base, engine, get_db
from .db.seed import reset_and_seed_db
from .models import Event
from .schemas import EventSchema, EventCreate, EventUpdate
from .schemas import GameSchema
from .models import Game
from .db import crud
from .schemas.shot import ShotCoordinateSchema
from .schemas.player import PlayerSchema
from .models import Player
from .routes.chat import router as chat_router

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

app.include_router(chat_router)


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


# ---------------------------------------------------------------------------
# Games endpoints
# ---------------------------------------------------------------------------


@app.get("/games", response_model=list[GameSchema], tags=["Games"])
async def list_games(db: Session = Depends(get_db)):
    """Return a list of distinct games derived from the Events table.

    Since the current dataset does not store games in a separate table, we
    derive unique combinations of (game_date, home_team, away_team) from the
    events data. An auto-generated incremental identifier is provided for
    frontend use only and is not persisted in the database.
    """

    return db.query(Game).all()


# ---------------------------------------------------------------------------
# Game details & events
# ---------------------------------------------------------------------------


@app.get("/games/{game_id}/events", response_model=list[EventSchema], tags=["Games"])
async def game_events(game_id: int, db: Session = Depends(get_db)):
    """Return all events belonging to the given game id."""

    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    events = (
        db.query(Event)
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
        )
        .all()
    )
    return events


@app.get("/games/{game_id}/shot-density", response_model=list[ShotCoordinateSchema], tags=["Games"])
async def game_shot_density(game_id: int, team: str | None = None, db: Session = Depends(get_db)):
    """Return all (x, y) shot coordinates for the given game.

    Optionally filter by *team* (home/away/team name).
    """

    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    query = (
        db.query(
            Event.x_coordinate.label("x"),
            Event.y_coordinate.label("y"),
        )
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
            Event.event.ilike("shot"),  # only shot events
            Event.x_coordinate.isnot(None),
            Event.y_coordinate.isnot(None),
        )
    )

    if team:
        query = query.filter(Event.team == team)

    rows = query.all()
    # Convert to list of dicts to satisfy response_model
    return [{"x": r.x, "y": r.y} for r in rows]


@app.get("/games/{game_id}/goal-density", response_model=list[ShotCoordinateSchema], tags=["Games"])
async def game_goal_density(game_id: int, team: str | None = None, db: Session = Depends(get_db)):
    """Return all (x, y) goal coordinates for the given game."""

    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    query = (
        db.query(Event.x_coordinate.label("x"), Event.y_coordinate.label("y"))
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
            Event.event.ilike("goal"),
            Event.x_coordinate.isnot(None),
            Event.y_coordinate.isnot(None),
        )
    )
    if team:
        query = query.filter(Event.team == team)

    rows = query.all()
    return [{"x": r.x, "y": r.y} for r in rows]


@app.get("/games/{game_id}/export", tags=["Games"])
async def export_game_data(game_id: int, db: Session = Depends(get_db)):
    """Return full game metadata and all associated events for the given game id.

    The payload structure is::
        {
            "game": { ... },
            "events": [ { ... }, ... ]
        }
    """

    # Fetch game record
    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    # Fetch all events that belong to this game
    events_q = (
        db.query(Event)
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
        )
        .all()
    )

    # Convert SQLAlchemy models to pydantic dicts for JSON response
    game_data = GameSchema.model_validate(game_obj).model_dump()
    event_data = [EventSchema.model_validate(ev).model_dump() for ev in events_q]

    return {"game": game_data, "events": event_data}


@app.get("/events", response_model=list[EventSchema], tags=["Events"])
async def list_events(limit: int = 100, skip: int = 0, db: Session = Depends(get_db)):
    """Return up to *limit* events from the database for demo purposes."""
    return crud.get_events(db, skip=skip, limit=limit)


@app.get("/event-types", response_model=list[str], tags=["Events"])
async def list_event_types(db: Session = Depends(get_db)):
    """Return all distinct values of Event.event column."""
    result = db.execute(select(distinct(Event.event))).scalars().all()
    # Filter None and sort
    return sorted(filter(None, result))


@app.get("/players", response_model=list[PlayerSchema], tags=["Players"])
async def list_players(limit: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if limit:
        query = query.limit(limit)
    return query.all()


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