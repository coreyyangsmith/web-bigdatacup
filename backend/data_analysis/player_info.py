import sys
from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATASET_CSV = DATA_DIR / "olympic_womens_dataset.csv"
JERSEY_CSV = DATA_DIR / "womens_hockey_jersey_numbers.csv"


def main():
    try:
        df = pd.read_csv(DATASET_CSV)
    except FileNotFoundError:
        print(f"Dataset not found at {DATASET_CSV}")
        sys.exit(1)

    # Normalise column names to snake_case
    df = df.rename(columns={
        "Home Team": "home_team",
        "Away Team": "away_team",
        "Team": "team",
        "Player": "player",
        "Player 2": "player_2",
    })

    # Melt player columns into one
    melted = pd.melt(
        df,
        id_vars=["team"],
        value_vars=["player", "player_2"],
        value_name="player_name",
    )

    melted = melted.dropna(subset=["player_name"]).drop_duplicates()
    melted = melted[["player_name", "team"]]

    # Attach jersey numbers if file exists
    if JERSEY_CSV.exists():
        jersey_df = pd.read_csv(JERSEY_CSV)
        if {"Player", "Jersey"}.issubset(jersey_df.columns):
            jersey_df = jersey_df.rename(columns={"Player": "player_name", "Jersey": "number"})
            melted = melted.merge(jersey_df, on="player_name", how="left")

    output_path = DATA_DIR / "players_with_numbers.csv"
    melted.to_csv(output_path, index=False)
    print(f"Exported {len(melted)} player rows to {output_path}")


if __name__ == "__main__":
    main()
