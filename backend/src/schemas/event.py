"""Pydantic schemas for Event objects.

Separated from `schemas.__init__` for better organisation and to align with the
other schema modules (`team.py`, `player.py`, etc.).
"""

from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class EventSchema(BaseModel):
    """Schema used for responses that include an event id (read-only)."""

    id: int
    game_date: str = Field(..., alias="game_date")
    home_team: str
    away_team: str
    period: int
    clock: str
    home_team_skaters: int
    away_team_skaters: int
    home_team_goals: int
    away_team_goals: int
    team: str
    player: str
    event: str
    x_coordinate: Optional[int] = None
    y_coordinate: Optional[int] = None
    detail_1: Optional[str] = None
    detail_2: Optional[str] = None
    detail_3: Optional[str] = None
    detail_4: Optional[str] = None
    player_2: Optional[str] = None
    x_coordinate_2: Optional[int] = None
    y_coordinate_2: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EventBase(BaseModel):
    """Shared attributes used for create & update operations."""

    game_date: str
    home_team: str
    away_team: str
    period: int
    clock: str
    home_team_skaters: int
    away_team_skaters: int
    home_team_goals: int
    away_team_goals: int
    team: str
    player: str
    event: str
    x_coordinate: Optional[int] = None
    y_coordinate: Optional[int] = None
    detail_1: Optional[str] = None
    detail_2: Optional[str] = None
    detail_3: Optional[str] = None
    detail_4: Optional[str] = None
    player_2: Optional[str] = None
    x_coordinate_2: Optional[int] = None
    y_coordinate_2: Optional[int] = None


class EventCreate(EventBase):
    """Schema for creating a new Event."""

    pass


class EventUpdate(EventBase):
    """Schema for updating an existing Event."""

    pass


__all__ = [
    "EventSchema",
    "EventBase",
    "EventCreate",
    "EventUpdate",
]
