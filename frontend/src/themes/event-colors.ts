/*
  Utility to map event types to tailwind-like colors.
  We export a predefined palette and a helper to assign colors deterministically.
*/

// Tailwind palette (500 variants)
const palette = [
  "#3b82f6", // blue
  "#10b981", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#22c55e", // emerald
  "#e11d48", // rose
  "#0ea5e9", // sky
]

/**
 * Build a mapping from event type (lower-case) to colour hex.
 * The mapping is deterministic so the same event type will always have the
 * same colour across renders (order of `eventTypes` doesn't matter).
 */
export function getEventTypeColorMap(eventTypes: string[]): Record<string, string> {
  const sorted = [...eventTypes].map((e) => e.toLowerCase()).sort()
  const mapping: Record<string, string> = {}
  sorted.forEach((etype, idx) => {
    mapping[etype] = palette[idx % palette.length]
  })
  return mapping
}

export type EventTypeColorMap = ReturnType<typeof getEventTypeColorMap> 