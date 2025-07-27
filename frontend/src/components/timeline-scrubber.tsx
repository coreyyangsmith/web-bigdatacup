import * as React from "react"
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import type { Event as GameEventApi } from "@/api/games"

// Helper: parse clock string (e.g. "19:43") to seconds remaining in period
const clockToSecondsRemaining = (clock: string): number => {
  const [minStr, secStr] = clock.split(":")
  const minutes = parseInt(minStr, 10)
  const seconds = parseInt(secStr, 10)
  return minutes * 60 + seconds
}

interface TimelineEvent {
  id: number
  time: number // seconds from game start
  period: number
  type: string // raw lowercase event name
  description: string
  player?: string | null
  team: string
}

interface TimelineScrubberProps {
  events: GameEventApi[] | null
  selectedPlayer: string
  eventTypeColors: Record<string, string>
  onTimeChange: (time: number) => void
}

export function TimelineScrubber({ events, selectedPlayer, eventTypeColors, onTimeChange }: TimelineScrubberProps) {
  // Build timeline events from API data
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    if (!events) return []

    const PERIOD_SECONDS = 20 * 60 // 20 min periods

    return events
      .filter((e) => !!e.clock && !!e.period && !!e.event)
      .map<TimelineEvent>((e) => {
        const secRemaining = clockToSecondsRemaining(e.clock)
        const elapsedInPeriod = PERIOD_SECONDS - secRemaining
        const absoluteTime = (e.period - 1) * PERIOD_SECONDS + elapsedInPeriod

        return {
          id: e.id,
          time: absoluteTime,
          period: e.period,
          type: (e.event as string).toLowerCase(),
          description: e.event ?? "",
          player: e.player,
          team: e.team,
        }
      })
  }, [events])

  // Apply player filter if not 'all'
  const filteredEvents = React.useMemo(() => {
    if (selectedPlayer === "all") return timelineEvents
    return timelineEvents.filter((ev) => (ev.player ?? "").toLowerCase() === selectedPlayer.toLowerCase())
  }, [timelineEvents, selectedPlayer])

  const maxTime = React.useMemo(() => {
    if (filteredEvents.length === 0) return 60
    return Math.max(...filteredEvents.map((ev) => ev.time))
  }, [filteredEvents])

  const periodBoundaries = React.useMemo(() => {
    if (filteredEvents.length === 0) return []
    const boundaries: number[] = []
    let currentPeriod = 1
    let lastTime = 0
    filteredEvents.forEach((event) => {
      if (event.period !== currentPeriod) {
        boundaries.push(lastTime)
        currentPeriod = event.period
      }
      lastTime = event.time
    })
    boundaries.push(lastTime) // Add the last event's time
    return boundaries
  }, [filteredEvents])

  const [currentTime, setCurrentTime] = React.useState([0])
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<TimelineEvent | null>(null)

  const formatTime = (seconds: number) => {
    const PERIOD_SECONDS = 20 * 60
    const period = Math.floor(seconds / PERIOD_SECONDS) + 1
    const timeInPeriod = seconds % PERIOD_SECONDS
    const minutes = Math.floor(timeInPeriod / 60)
    const secs = Math.floor(timeInPeriod % 60)
    return `P${period} ${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value)
    onTimeChange(value[0])

    // Find nearest event within 3s window
    const nearbyEvent = filteredEvents.find((event) => Math.abs(event.time - value[0]) < 3)
    setSelectedEvent(nearbyEvent || null)
  }

  const jumpToEvent = (event: TimelineEvent) => {
    setCurrentTime([event.time])
    onTimeChange(event.time)
    setSelectedEvent(event)
  }

  // Playback effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = Math.min(prev[0] + 1, maxTime)
          onTimeChange(newTime)
          if (newTime >= maxTime) {
            setIsPlaying(false)
          }
          return [newTime]
        })
      }, 500) // 0.5s per game second
    }
    return () => clearInterval(interval)
  }, [isPlaying, maxTime, onTimeChange])

  const getPreviousEvent = () => {
    return filteredEvents.filter((event) => event.time < currentTime[0]).sort((a, b) => b.time - a.time)[0]
  }
  const getNextEvent = () => {
    return filteredEvents.filter((event) => event.time > currentTime[0]).sort((a, b) => a.time - b.time)[0]
  }

  const jumpToPreviousEvent = () => {
    const prevEvent = getPreviousEvent()
    if (prevEvent) jumpToEvent(prevEvent)
  }
  const jumpToNextEvent = () => {
    const nextEvent = getNextEvent()
    if (nextEvent) jumpToEvent(nextEvent)
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Timeline Controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => handleTimeChange([0])}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)} disabled={filteredEvents.length === 0}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleTimeChange([maxTime])}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={() => jumpToPreviousEvent()} disabled={!getPreviousEvent()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => jumpToNextEvent()} disabled={!getNextEvent()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-sm font-mono">{formatTime(currentTime[0])}</div>
          </div>

          {/* Timeline Slider */}
          <div className="relative">
            <Slider
              value={currentTime}
              onValueChange={handleTimeChange}
              max={maxTime}
              min={0}
              step={1}
              className="w-full"
            />

            {/* Period separation lines */}
            <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
              {periodBoundaries.map((t, idx) => (
                idx > 0 && (
                  <div
                    key={`period-${idx}`}
                    className="absolute top-0 h-6 border-l border-border text-[10px] text-muted-foreground select-none"
                    style={{ left: `${(t / maxTime) * 100}%` }}
                  >
                    <span className="absolute -top-4 -ml-2">{idx + 1 <= 3 ? `P${idx + 1}` : "OT"}</span>
                  </div>
                )
              ))}
            </div>

            {/* Event Markers */}
            <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="absolute top-0 w-2 h-6 cursor-pointer pointer-events-auto"
                  style={{ left: `${(event.time / maxTime) * 100}%` }}
                  onClick={() => jumpToEvent(event)}
                >
                  <div
                    className="w-2 h-6 rounded-sm"
                    style={{ backgroundColor: eventTypeColors[event.type] ?? "#6b7280" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Event Details */}
          {selectedEvent && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Badge
                style={{
                  backgroundColor: eventTypeColors[selectedEvent.type] ?? "#64748b",
                  color: "white",
                }}
              >
                {selectedEvent.type.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium">{formatTime(selectedEvent.time)}</span>
              <span className="text-sm">{selectedEvent.description}</span>
              {selectedEvent.player && <span className="text-sm text-muted-foreground">({selectedEvent.player})</span>}
            </div>
          )}

          {/* Event Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-8 text-xs">
            {Object.entries(eventTypeColors).map(([etype, color]) => (
              <div key={etype} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span>{etype}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
