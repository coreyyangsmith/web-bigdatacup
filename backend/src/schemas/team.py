from pydantic import BaseModel, ConfigDict


class TeamSchema(BaseModel):
    """Represents a single team returned by the API."""
    
    id: int
    name: str
    abbreviation: str

    model_config = ConfigDict(from_attributes=True) 