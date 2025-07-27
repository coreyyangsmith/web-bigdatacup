import pandas as pd
from pathlib import Path

# Use Path to construct the correct path relative to this script
csv_path = Path(__file__).resolve().parent.parent / "data" / "olympic_womens_dataset_trimmed.csv"

# Read the CSV file
df = pd.read_csv(csv_path)

# The CSV has the following columns as provided in the header:
# "game_date","Home Team","Away Team","Period","Clock","Home Team Skaters","Away Team Skaters","Home Team Goals","Away Team Goals","Team","Player","Event","X Coordinate","Y Coordinate","Detail 1","Detail 2","Detail 3","Detail 4","Player 2","X Coordinate 2","Y Coordinate 2"

# Filter for the specific game: Olympic (Women) - Finland (home) vs Olympic (Women) - United States (away)
filtered_df = df[
    (df['Home Team'] == 'Olympic (Women) - Finland') & (df['Away Team'] == 'Olympic (Women) - United States')
]

print(f"Found {len(filtered_df)} records for the game Olympic (Women) - Finland vs Olympic (Women) - United States")
print(filtered_df.head(10))  # Show first 10 rows instead of all data

# Export the filtered data to a new CSV file
output_filename = Path(__file__).resolve().parent.parent / "data" / "filtered_finland_vs_usa_game.csv"
filtered_df.to_csv(output_filename, index=False)
print(f"Filtered data exported to {output_filename}")
