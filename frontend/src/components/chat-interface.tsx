import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { streamChat, type ChatMessage } from "@/api/chat";

export function ChatInterface() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I\'m your hockey analytics assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  React.useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    // Add placeholder assistant message to update in-place
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      await streamChat(updatedMessages, (chunk) => {
        setMessages((prev) => {
          const lastIndex = prev.length - 1
          const last = prev[lastIndex]
          if (last.role !== "assistant") return prev // safety
          // Append chunk to last assistant message
          const updated = { ...last, content: last.content + chunk }
          const copy = [...prev]
          copy[lastIndex] = updated
          return copy
        })
      })
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
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
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  )
} 