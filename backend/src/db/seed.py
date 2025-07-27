"""Utility to reset (drop & recreate) the DB and seed it with the Olympic Women's dataset."""

from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

import logging

# Get module-level logger
logger = logging.getLogger(__name__)

from .database import Base, SessionLocal, engine
from ..models import Event, Team, Player, Game

# Path to jersey numbers CSV (must have columns Player,Number). Typo fixed and fallbacks supported.
PLAYER_INFO_CSV = Path(__file__).resolve().parents[2] / "data" / "womens_hockey_jersey_numbers.csv"

import random

# Ensure deterministic random assignment per run (optional)
random.seed(42)


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

    used_abbr: set[str] = set()

    def _abbr(name: str) -> str:
        # Take last segment after '-' to avoid prefix like 'Olympic (Women) - '
        seg = name.split("-")[-1].strip()
        letters = "".join(ch for ch in seg if ch.isalpha())
        if len(letters) >= 3:
            base = letters[:3].upper()
        else:
            base = (letters.upper() + "XXX")[:3]
        abbr = base
        # Ensure uniqueness
        i = 1
        while abbr in used_abbr:
            if len(base) == 3 and i < 10:
                abbr = base[:2] + str(i)
            else:
                abbr = (base + chr(64 + i))[:3]
            i += 1
        used_abbr.add(abbr)
        return abbr

    teams = [Team(name=name, abbreviation=_abbr(name)) for name in unique_team_names]
    logger.info("Prepared %d teams for bulk insert", len(teams))

    # -----------------------------
    # Unique players (strip & dedup)
    # -----------------------------
    player_series = pd.concat([df["player"], df["player_2"]])
    # Remove null/None then strip whitespace
    cleaned_names = (
        player_series.dropna()
        .map(lambda x: str(x).strip())
    )
    # Remove empty strings
    cleaned_names = cleaned_names[cleaned_names != ""]

    unique_player_names = sorted(cleaned_names.unique())

    number_lookup: dict[str, int] = {}
    if PLAYER_INFO_CSV.exists():
        try:
            pi_df = pd.read_csv(PLAYER_INFO_CSV)
            # allow either Number or Jersey Number column naming
            num_col = None
            for c in ["Number", "Jersey Number", "Jersey"]:
                if c in pi_df.columns:
                    num_col = c
                    break
            if num_col and "Player" in pi_df.columns:
                # Use iterrows instead of itertuples to keep the original column names
                # (itertuples sanitises names like "Jersey Number" → "Jersey_Number")
                pi_df = pi_df.rename(columns=lambda col: col.strip())
                for _, csv_row in pi_df.iterrows():
                    player_name = str(csv_row["Player"]).strip().lower()
                    number_val = csv_row[num_col]
                    if pd.notna(number_val):
                        number_lookup[player_name] = int(number_val)
        except Exception as exc:
            logger.warning("Failed to read jersey numbers CSV: %s", exc)

    assigned_numbers: set[int] = set(number_lookup.values())

    def _random_unused() -> int:
        for _ in range(200):
            num = random.randint(1, 98)
            if num not in assigned_numbers:
                assigned_numbers.add(num)
                return num
        return 0  # fallback

    players = [
        Player(
            name=name,
            number=number_lookup.get(name.lower()) or _random_unused(),
        )
        for name in unique_player_names
    ]
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