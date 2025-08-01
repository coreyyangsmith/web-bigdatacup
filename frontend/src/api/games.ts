import { http } from "./http"

export interface Game {
  id: number
  game_date: string
  home_team: string
  away_team: string
}

export async function fetchGames(): Promise<Game[]> {
  const { data } = await http.get<Game[]>("/games")
  return data
}

export interface Event {
  id: number
  game_date: string
  home_team: string
  away_team: string
  period: number
  clock: string
  home_team_skaters: number
  away_team_skaters: number
  team: string
  player: string
  event: string
  detail_1?: string | null
  detail_2?: string | null
  detail_3?: string | null
  detail_4?: string | null
  x_coordinate?: number | null
  y_coordinate?: number | null
  player_2?: string | null
  x_coordinate_2?: number | null
  y_coordinate_2?: number | null
}

export async function fetchGameEvents(gameId: number): Promise<Event[]> {
  const { data } = await http.get<Event[]>(`/games/${gameId}/events`)
  return data
}

export interface ShotCoordinate {
  x: number
  y: number
}

export async function fetchGameShotDensity(gameId: number): Promise<ShotCoordinate[]> {
  const { data } = await http.get<ShotCoordinate[]>(`/games/${gameId}/shot-density`)
  return data
}

export async function fetchGameGoalDensity(gameId: number): Promise<ShotCoordinate[]> {
  const { data } = await http.get<ShotCoordinate[]>(`/games/${gameId}/goal-density`)
  return data
}

export async function fetchEventTypes(): Promise<string[]> {
  const { data } = await http.get<string[]>("/events/types")
  return data
}

export interface PlayerInfo {
  id: number
  name: string
  number?: number | null
}

export async function fetchPlayers(): Promise<PlayerInfo[]> {
  const { data } = await http.get<PlayerInfo[]>("/players")
  return data
}

export interface GameExport {
  game: {
    id: number
    game_date: string
    home_team: string
    away_team: string
  }
  events: Event[]
}

export async function exportGameData(gameId: number): Promise<GameExport> {
  const { data } = await http.get<GameExport>(`/games/${gameId}/export`)
  return data
}
