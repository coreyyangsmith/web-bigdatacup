from pydantic import BaseModel, ConfigDict


class PlayerSchema(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True) 