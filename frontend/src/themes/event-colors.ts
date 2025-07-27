/*
  Utility to map event types to tailwind-like colors.
  We export predefined color mappings for specific hockey event types.
*/

// Color mappings for specific hockey event types
const eventColorMap = {
  // Scoring events - Red spectrum
  "goal": "#dc2626", // red-600
  "shot": "#f87171", // red-400
  
  // Possession events - Blue spectrum
  "puck recovery": "#2563eb", // blue-600
  "takeaway": "#3b82f6", // blue-500
  "zone entry": "#60a5fa", // blue-400
  
  // Face-off events - Purple spectrum
  "faceoff win": "#7c3aed", // violet-600
  
  // Penalties - Orange/amber spectrum
  "penalty taken": "#ea580c", // orange-600
  
  // General play events - Green spectrum
  "play": "#16a34a", // green-600
  "incomplete play": "#4ade80", // green-400
  
  // Dump events - Teal spectrum
  "dump in/out": "#0d9488", // teal-600
  
  // Default fallback - Gray
  "other": "#6b7280", // gray-500
}

/**
 * Build a mapping from event type (lower-case) to colour hex.
 * Uses predefined mappings for known hockey events, falls back to gray for unknown events.
 */
export function getEventTypeColorMap(eventTypes: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  eventTypes.forEach((eventType) => {
    const normalizedType = eventType.toLowerCase()
    mapping[normalizedType] = eventColorMap[normalizedType as keyof typeof eventColorMap] || eventColorMap.other
  })
  
  return mapping
}

export type EventTypeColorMap = ReturnType<typeof getEventTypeColorMap> 