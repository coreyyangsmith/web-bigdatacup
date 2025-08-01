"""Player listing endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models import Player
from ..schemas.player import PlayerSchema

router = APIRouter(prefix="/players", tags=["Players"])


@router.get("", response_model=list[PlayerSchema])
async def list_players(limit: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if limit:
        query = query.limit(limit)
    return query.all()
