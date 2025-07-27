from sqlalchemy.orm import Session

from ..models import Event
from ..schemas import EventCreate, EventUpdate


def get_event(db: Session, event_id: int) -> Event | None:
    return db.query(Event).filter(Event.id == event_id).first()


def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Event).offset(skip).limit(limit).all()


def create_event(db: Session, event_in: EventCreate) -> Event:
    obj = Event(**event_in.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_event(db: Session, db_obj: Event, event_in: EventUpdate) -> Event:
    for field, value in event_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_event(db: Session, db_obj: Event) -> None:
    db.delete(db_obj)
    db.commit() 