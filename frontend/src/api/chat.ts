import { http } from "./http"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface GameContext {
  game_date: string
  home_team: string
  away_team: string
}

export async function sendChat(
  messages: ChatMessage[],
  game: GameContext,
): Promise<string> {
  try {
    const { data } = await http.post<{ role: string; content: string }>(
      "/chat",
      {
        messages,
        game,
      },
    )

    return data.content
  } catch (error: any) {
    const errorText =
      error?.response?.data ?? error?.message ?? "Failed to get chat response. Please try again."
    throw new Error(errorText)
  }
}
