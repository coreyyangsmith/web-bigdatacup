"""Routes related to games and game-derived data."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import distinct, select

from ..db.database import get_db
from ..models import Game, Event
from ..schemas import GameSchema, EventSchema
from ..schemas.shot import ShotCoordinateSchema

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("", response_model=list[GameSchema])
async def list_games(db: Session = Depends(get_db)):
    """Return all *Game* records."""
    return db.query(Game).all()


@router.get("/{game_id}/events", response_model=list[EventSchema])
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


@router.get("/{game_id}/shot-density", response_model=list[ShotCoordinateSchema])
async def game_shot_density(game_id: int, team: str | None = None, db: Session = Depends(get_db)):
    """Return all (x, y) shot coordinates for the given game.

    Optionally filter by *team* (home/away/team name).
    """
    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    query = (
        db.query(Event.x_coordinate.label("x"), Event.y_coordinate.label("y"))
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
            Event.event.ilike("shot"),
            Event.x_coordinate.isnot(None),
            Event.y_coordinate.isnot(None),
        )
    )

    if team:
        query = query.filter(Event.team == team)

    rows = query.all()
    return [{"x": r.x, "y": r.y} for r in rows]


@router.get("/{game_id}/goal-density", response_model=list[ShotCoordinateSchema])
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


@router.get("/{game_id}/export")
async def export_game_data(game_id: int, db: Session = Depends(get_db)):
    """Return full game metadata and all associated events for the given game id."""
    from fastapi.responses import JSONResponse  # imported here to avoid circular imports

    # Fetch game
    game_obj = db.query(Game).filter(Game.id == game_id).first()
    if not game_obj:
        raise HTTPException(status_code=404, detail="Game not found")

    events_q = (
        db.query(Event)
        .filter(
            Event.game_date == game_obj.game_date,
            Event.home_team == game_obj.home_team,
            Event.away_team == game_obj.away_team,
        )
        .all()
    )

    game_data = GameSchema.model_validate(game_obj).model_dump()
    event_data = [EventSchema.model_validate(ev).model_dump() for ev in events_q]

    payload = {"game": game_data, "events": event_data}

    safe_home = game_data["home_team"].replace(" ", "_")
    safe_away = game_data["away_team"].replace(" ", "_")
    filename = f"{game_data['game_date']}_{safe_home}_vs_{safe_away}.json"

    return JSONResponse(content=payload, headers={"Content-Disposition": f"attachment; filename=\"{filename}\""})
