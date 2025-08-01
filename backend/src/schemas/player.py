from pydantic import BaseModel, ConfigDict


class PlayerSchema(BaseModel):
    """Represents a single player returned by the API."""
    
    id: int
    name: str
    number: int | None = None

    model_config = ConfigDict(from_attributes=True) 