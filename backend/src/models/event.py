from sqlalchemy import Column, Integer, String

from ..db.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_date = Column(String)
    home_team = Column(String)
    away_team = Column(String)
    period = Column(Integer)
    clock = Column(String)
    home_team_skaters = Column(Integer)
    away_team_skaters = Column(Integer)
    home_team_goals = Column(Integer)
    away_team_goals = Column(Integer)
    team = Column(String)
    player = Column(String)
    event = Column(String)
    x_coordinate = Column(Integer, nullable=True)
    y_coordinate = Column(Integer, nullable=True)
    detail_1 = Column(String, nullable=True)
    detail_2 = Column(String, nullable=True)
    detail_3 = Column(String, nullable=True)
    detail_4 = Column(String, nullable=True)
    player_2 = Column(String, nullable=True)
    x_coordinate_2 = Column(Integer, nullable=True)
    y_coordinate_2 = Column(Integer, nullable=True) 