import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { sendChat, type ChatMessage, type GameContext } from "@/api/chat";
import { useState } from "react";

interface SelectedGame {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
}

export function ChatInterface({ game }: { game: SelectedGame }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I\'m your hockey analytics assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const exampleQueries = [
    "How many incomplete plays did each team have?",
    "Which player has the most shots on goal?",
    "List the distinct event types in the dataset.",
  ] as const

  // Scroll to bottom whenever messages change
  React.useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Resize textarea whenever input value changes
  React.useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
  }, [input])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() === "") return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const gameCtx: GameContext = {
      game_date: game.date.split("T")[0] ?? game.date,
      home_team: game.homeTeam,
      away_team: game.awayTeam,
    };

    try {
      const assistantResponse = await sendChat(newMessages, gameCtx);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantResponse,
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the server.",
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold">PuckQuery</h3>
        <p className="text-xs text-muted-foreground">Ask hockey questions. Gain instant insights.</p>
        <div className="h-px bg-border mt-2" />
      </div>
      {/* Messages */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto space-y-2 px-1 pb-2 border border-border rounded-lg">
        <div className="flex flex-col space-y-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap break-words",
                m.role === "user"
                  ? "self-end text-white ml-auto"
                  : "self-start text-foreground bg-muted"
              )}
              style={
                m.role === "user"
                  ? { backgroundColor: "#D2001C", hyphens: "auto" }
                  : { hyphens: "auto" }
              }
            >
              {m.content}
            </div>
          ))}
        </div>
      </div>

      {/* Example queries */}
      <div className="mt-3 mb-1 flex flex-wrap gap-2 text-xs">
        {exampleQueries.map((q) => (
          <button
            key={q}
            type="button"
            className="px-2 py-1 rounded bg-muted hover:bg-muted/80 border border-border"
            onClick={() => setInput(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-1">
        <textarea
          value={input}
          ref={textareaRef}
          onChange={(e) => {
            setInput(e.target.value)
            // Auto-resize as user types
            const el = e.target as HTMLTextAreaElement
            el.style.height = "auto"
            el.style.height = `${el.scrollHeight}px`
          }}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          style={{}}
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? (<svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>) : "Send"}
        </Button>
      </form>
    </div>
  )
} 