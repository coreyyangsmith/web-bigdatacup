import pandas as pd
import os

def enrich_jersey_numbers_with_dates():
    """
    Read women's hockey jersey numbers and enrich with dates from Olympic women's dataset
    based on matching games.
    """
    
    # Read the jersey numbers CSV
    jersey_path = os.path.join('backend', 'data', 'womens_hockey_jersey_numbers.csv')
    jersey_df = pd.read_csv(jersey_path)
    
    # Read the player info CSV (contains the Olympic women's dataset with dates)
    player_info_path = os.path.join('backend', 'data', 'player_info.csv')
    player_info_df = pd.read_csv(player_info_path)
    
    # Create a copy of jersey data to enrich
    enriched_df = jersey_df.copy()
    
    # Merge on Player, Team, Home Team, and Away Team to get matching dates
    # This will add the Date column from player_info to jersey data where games match
    enriched_df = enriched_df.merge(
        player_info_df[['Player', 'Team', 'Home Team', 'Away Team', 'Date']],
        on=['Player', 'Team', 'Home Team', 'Away Team'],
        how='left',
        suffixes=('', '_from_olympic')
    )
    
    # Update the Date column with the merged dates
    enriched_df['Date'] = enriched_df['Date_from_olympic']
    
    # Drop the temporary column
    enriched_df = enriched_df.drop('Date_from_olympic', axis=1)
    
    # Rename Jersey column to Jersey Number for consistency
    if 'Jersey' in enriched_df.columns:
        enriched_df = enriched_df.rename(columns={'Jersey': 'Jersey Number'})
    
    # Save the enriched dataset
    output_path = os.path.join('backend', 'data', 'hockey_players_with_jersey_numbers.csv')
    enriched_df.to_csv(output_path, index=False)
    
    print(f"Enriched jersey numbers saved to {output_path}")
    print(f"Total records: {len(enriched_df)}")
    print(f"Records with dates: {len(enriched_df[enriched_df['Date'].notna()])}")
    
    return enriched_df

if __name__ == "__main__":
    enriched_data = enrich_jersey_numbers_with_dates()
