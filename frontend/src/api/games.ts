export interface Game {
  id: number;
  game_date: string;
  home_team: string;
  away_team: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchGames(): Promise<Game[]> {
  const res = await fetch(`${API_BASE_URL}/games`);
  if (!res.ok) {
    throw new Error("Failed to fetch games");
  }
  return res.json();
} 