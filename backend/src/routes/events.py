"""Event listing and CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct

from ..db.database import get_db
from ..db import crud
from ..models import Event
from ..schemas import EventSchema, EventCreate, EventUpdate

router = APIRouter(prefix="/events", tags=["Events"])


# ---------------------------------------------------------------------------
# Listing / filtering
# ---------------------------------------------------------------------------


@router.get("", response_model=list[EventSchema])
async def list_events(limit: int = 100, skip: int = 0, db: Session = Depends(get_db)):
    """Return up to *limit* events from the database for demo purposes."""
    return crud.get_events(db, skip=skip, limit=limit)


@router.get("/types", response_model=list[str])
async def list_event_types(db: Session = Depends(get_db)):
    """Return all distinct values of Event.event column."""
    result = db.execute(select(distinct(Event.event))).scalars().all()
    return sorted(filter(None, result))


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=EventSchema)
async def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db, event_in)


@router.get("/{event_id}", response_model=EventSchema)
async def get_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventSchema)
async def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return crud.update_event(db, event, event_in)


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    crud.delete_event(db, event)
    return Response(status_code=204)
