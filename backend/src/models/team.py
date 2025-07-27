from sqlalchemy import Column, Integer, String

from ..db.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    abbreviation = Column(String(10), unique=True, nullable=False) 