from sqlalchemy import Column, Integer, String

from ..db.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_date = Column(String)
    home_team = Column(String)
    away_team = Column(String) 