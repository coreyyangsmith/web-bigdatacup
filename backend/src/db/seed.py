"""Utility to reset (drop & recreate) the DB and seed it with the Olympic Women's dataset."""

from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

import logging

# Get module-level logger
logger = logging.getLogger(__name__)

from .database import Base, SessionLocal, engine
from ..models import Event, Team, Player, Game

# Path to jersey numbers CSV (must have columns Player,Number)
PLAYER_INFO_CSV = Path(__file__).resolve().parents[2] / "data" / "womens_hockey_jeresey_number.csv"


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

    # ---------------------------------------------------------------------
    # Prepare Teams, Players, Games, Events
    # ---------------------------------------------------------------------

    # Unique teams from home/away/team columns
    team_series = pd.concat([df["home_team"], df["away_team"], df["team"]])
    unique_team_names = team_series.dropna().unique()
    teams = [Team(name=name) for name in unique_team_names]
    logger.info("Prepared %d teams for bulk insert", len(teams))

    # Unique players with optional jersey numbers
    player_series = pd.concat([df["player"], df["player_2"]])
    unique_player_names = player_series.dropna().unique()

    number_lookup: dict[str, int] = {}
    if PLAYER_INFO_CSV.exists():
        try:
            pi_df = pd.read_csv(PLAYER_INFO_CSV)
            if {"Player", "Number"}.issubset(pi_df.columns):
                number_lookup = {
                    row.Player.strip(): int(row.Number)
                    for row in pi_df.itertuples(index=False)
                    if pd.notna(row.Number)
                }
        except Exception as exc:
            logger.warning("Failed to read player_info.csv: %s", exc)

    players = [Player(name=name, number=number_lookup.get(name)) for name in unique_player_names]
    logger.info("Prepared %d players for bulk insert (with jersey numbers)", len(players))

    # Unique games based on date + teams
    unique_games_df = df[["game_date", "home_team", "away_team"]].drop_duplicates()
    games = [
        Game(game_date=row.game_date, home_team=row.home_team, away_team=row.away_team)
        for row in unique_games_df.itertuples(index=False)
    ]
    logger.info("Prepared %d games for bulk insert", len(games))

    # Events (one per row)
    records = df.to_dict(orient="records")
    events = [Event(**record) for record in records]
    logger.info("Prepared %d events for bulk insert", len(events))

    session: Session = SessionLocal()
    try:
        # Insert in logical order to respect potential future FKs
        session.bulk_save_objects(teams)
        session.bulk_save_objects(players)
        session.bulk_save_objects(games)
        session.bulk_save_objects(events)
        session.commit()
        logger.info("Database seeding complete")
    finally:
        session.close() 