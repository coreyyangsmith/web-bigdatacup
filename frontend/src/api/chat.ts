export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GameContext {
  game_date: string;
  home_team: string;
  away_team: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000";

export async function sendChat(messages: ChatMessage[], game: GameContext): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, game }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get chat response: ${errorText}. Please try again.`);
  }

  const data = (await res.json()) as { role: string; content: string };
  return data.content;
} 