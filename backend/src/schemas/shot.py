from pydantic import BaseModel, ConfigDict


class ShotCoordinateSchema(BaseModel):
    """Represents a single shot coordinate returned by the API."""

    x: int
    y: int

    # Allow ORM objects / named tuples
    model_config = ConfigDict(from_attributes=True) 