from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from .team import TeamSchema
from .player import PlayerSchema
from .game import GameSchema


class EventSchema(BaseModel):
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
    pass


class EventUpdate(EventBase):
    pass

__all__ = ["EventSchema"]
__all__.extend(["EventBase", "EventCreate", "EventUpdate"])
__all__.extend(["TeamSchema", "PlayerSchema", "GameSchema"])
