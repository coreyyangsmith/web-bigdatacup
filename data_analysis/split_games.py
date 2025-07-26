import pandas as pd
import os

def split_games():
    # Read the dataset
    df = pd.read_csv('data/olympic_womens_dataset.csv')
    
    # Create the output directory if it doesn't exist
    os.makedirs('data/games', exist_ok=True)
    
    # Get unique game combinations
    unique_games = df[['Home Team', 'Away Team', 'game_date']].drop_duplicates()
    
    for _, game in unique_games.iterrows():
        home_team = game['Home Team']
        away_team = game['Away Team']
        game_date = game['game_date']
        
        # Filter data for this specific game
        game_data = df[
            (df['Home Team'] == home_team) & 
            (df['Away Team'] == away_team) & 
            (df['game_date'] == game_date)
        ]
        
        # Create filename as "home_away"
        filename = f"{home_team.replace(' ', '_')}_{away_team.replace(' ', '_')}.csv"
        filepath = os.path.join('data/games', filename)
        
        # Save the game data
        game_data.to_csv(filepath, index=False)
        print(f"Saved game: {filename}")

if __name__ == "__main__":
    split_games()
