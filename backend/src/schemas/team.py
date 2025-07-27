from pydantic import BaseModel, ConfigDict


class TeamSchema(BaseModel):
    id: int
    name: str
    abbreviation: str

    model_config = ConfigDict(from_attributes=True) 