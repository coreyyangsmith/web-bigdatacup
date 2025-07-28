export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get chat response: ${errorText}`);
  }

  const data = (await res.json()) as { content: string };
  return data.content;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) {
    const errorText = await res.text();
    throw new Error(`Failed to stream chat response: ${errorText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    if (chunk) onChunk(chunk);
  }
} 