from pydantic import BaseModel, ConfigDict


class PlayerSchema(BaseModel):
    id: int
    name: str
    number: int | None = None

    model_config = ConfigDict(from_attributes=True) 