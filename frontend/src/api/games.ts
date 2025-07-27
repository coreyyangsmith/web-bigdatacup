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

export interface Event {
  id: number;
  game_date: string;
  home_team: string;
  away_team: string;
  period: number;
  clock: string;
  team: string;
  player: string;
  event: string;
  detail_1?: string | null;
  detail_2?: string | null;
  detail_3?: string | null;
  detail_4?: string | null;
}

export async function fetchGameEvents(gameId: number): Promise<Event[]> {
  const res = await fetch(`${API_BASE_URL}/games/${gameId}/events`);
  if (!res.ok) {
    throw new Error("Failed to fetch game events");
  }
  return res.json();
}

export interface ShotCoordinate {
  x: number;
  y: number;
}

export async function fetchGameShotDensity(gameId: number): Promise<ShotCoordinate[]> {
  const res = await fetch(`${API_BASE_URL}/games/${gameId}/shot-density`);
  if (!res.ok) {
    throw new Error("Failed to fetch shot density");
  }
  return res.json();
}

export async function fetchEventTypes(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/event-types`);
  if (!res.ok) {
    throw new Error("Failed to fetch event types");
  }
  return res.json();
} 