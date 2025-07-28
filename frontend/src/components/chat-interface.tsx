import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I\'m your hockey analytics assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  React.useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")

    // TODO: Replace with real backend call
    // For now, echo back a placeholder response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "(This is a placeholder response. Backend integration coming soon.)",
        },
      ])
    }, 400)
  }

  return (
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold">PuckQuery</h3>
        <p className="text-xs text-muted-foreground">Ask hockey questions. Gain instant insights.</p>
        <div className="h-px bg-border mt-2" />
      </div>
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 px-1 pb-2 border border-border rounded-lg">
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

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  )
} 