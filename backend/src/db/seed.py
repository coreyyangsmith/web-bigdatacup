"""Utility to reset (drop & recreate) the DB and seed it with the Olympic Women's dataset."""

from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

import logging

# Get module-level logger
logger = logging.getLogger(__name__)

from .database import Base, SessionLocal, engine
from ..models import Event


def reset_and_seed_db() -> None:
    """Drop existing tables, recreate them, and load data from CSV."""

    # Drop & recreate schema
    logger.info("Dropping existing database tables…")
    Base.metadata.drop_all(bind=engine)
    logger.info("Creating new database tables…")
    Base.metadata.create_all(bind=engine)

    # Load CSV
    csv_path = Path(__file__).resolve().parents[2] / "data" / "olympic_womens_dataset.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset file not found at {csv_path}")

    logger.info("Loading CSV data from %s", csv_path)
    df = pd.read_csv(csv_path)

    # Rename columns to snake_case to match model fields
    df = df.rename(
        columns={
            "Game Date": "game_date",
            "Home Team": "home_team",
            "Away Team": "away_team",
            "Period": "period",
            "Clock": "clock",
            "Home Team Skaters": "home_team_skaters",
            "Away Team Skaters": "away_team_skaters",
            "Home Team Goals": "home_team_goals",
            "Away Team Goals": "away_team_goals",
            "Team": "team",
            "Player": "player",
            "Event": "event",
            "X Coordinate": "x_coordinate",
            "Y Coordinate": "y_coordinate",
            "Detail 1": "detail_1",
            "Detail 2": "detail_2",
            "Detail 3": "detail_3",
            "Detail 4": "detail_4",
            "Player 2": "player_2",
            "X Coordinate 2": "x_coordinate_2",
            "Y Coordinate 2": "y_coordinate_2",
        }
    )

    # Fill NaNs with None for SQLAlchemy compatibility
    df = df.where(pd.notna(df), None)

    # Bulk insert
    records = df.to_dict(orient="records")
    events = [Event(**record) for record in records]
    logger.info("Prepared %d events for bulk insert", len(events))

    session: Session = SessionLocal()
    try:
        session.bulk_save_objects(events)
        session.commit()
        logger.info("Database seeding complete")
    finally:
        session.close() 