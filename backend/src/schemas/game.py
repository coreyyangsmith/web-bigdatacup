from pydantic import BaseModel, ConfigDict


class GameSchema(BaseModel):
    id: int
    game_date: str
    home_team: str
    away_team: str

    model_config = ConfigDict(from_attributes=True) 