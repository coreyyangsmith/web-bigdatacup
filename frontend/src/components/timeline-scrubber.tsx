import * as React from "react"
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, ChevronDown, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  player_2?: string | null
  team: string
  home_team_skaters: number
  away_team_skaters: number
  home_team: string
  away_team: string
  detail_1?: string | null
  detail_2?: string | null
  detail_3?: string | null
  detail_4?: string | null
}

interface TimelineScrubberProps {
  events: GameEventApi[] | null
  selectedPlayer: string
  selectedTeam: string
  eventTypeColors: Record<string, string>
  onTimeChange: (time: number) => void
}

export function TimelineScrubber({ events, selectedPlayer, selectedTeam, eventTypeColors, onTimeChange }: TimelineScrubberProps) {
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
          player_2: e.player_2,
          team: e.team,
          home_team_skaters: e.home_team_skaters,
          away_team_skaters: e.away_team_skaters,
          home_team: e.home_team,
          away_team: e.away_team,
          detail_1: e.detail_1,
          detail_2: e.detail_2,
          detail_3: e.detail_3,
          detail_4: e.detail_4,
        }
      })
  }, [events])

  // Derive home & away team names from first event (if available)
  const homeTeamName = timelineEvents[0]?.team ? timelineEvents[0].home_team : timelineEvents[0]?.home_team || "Home"
  const awayTeamName = timelineEvents[0]?.away_team || "Away"

  const teamAbbr = React.useCallback((teamName: string | undefined | null): string => {
    if (!teamName) return "";
    const seg = teamName.split("-").pop()?.trim() ?? teamName;
    const letters = seg.replace(/[^A-Za-z]/g, "").toUpperCase();
    if (letters.length >= 3) return letters.slice(0, 3);
    return (letters + "XXX").slice(0, 3);
  }, []);

  // ---------------- Event Type Filter ----------------
  const EVENT_TYPE_GROUPS: { label: string; types: string[] }[] = [
    { label: "Scoring Events", types: ["goal", "shot"] },
    { label: "Possession Events", types: ["puck recovery", "takeaway", "zone entry"] },
    { label: "Face-off Events", types: ["faceoff win"] },
    { label: "Penalties", types: ["penalty taken"] },
    { label: "General Play", types: ["play", "incomplete play"] },
    { label: "Dump Events", types: ["dump in/out"] },
  ]

  const [selectedEventType, setSelectedEventType] = React.useState<string>("all")

  // Apply player filter if not 'all'
  const filteredEvents = React.useMemo(() => {
    let res = timelineEvents

    if (selectedPlayer !== "all") {
      res = res.filter((ev) => (ev.player ?? "").toLowerCase() === selectedPlayer.toLowerCase())
    } else if (selectedTeam !== "all") {
      res = res.filter((ev) => (ev.team ?? "").toLowerCase() === selectedTeam.toLowerCase())
    }

    if (selectedEventType !== "all") {
      res = res.filter((ev) => ev.type === selectedEventType)
    }

    return res
  }, [timelineEvents, selectedPlayer, selectedTeam, selectedEventType])

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

  // Period colored segments (P1, P2, P3, OT...)
  const PERIOD_SECONDS = 20 * 60
  const periodSegments = React.useMemo(() => {
    const segments: { start: number; end: number; idx: number }[] = []
    if (maxTime === 0) return segments
    const num = Math.ceil(maxTime / PERIOD_SECONDS)
    for (let i = 0; i < num; i++) {
      segments.push({ start: i * PERIOD_SECONDS, end: Math.min((i + 1) * PERIOD_SECONDS, maxTime), idx: i })
    }
    return segments
  }, [maxTime])

  const [currentTime, setCurrentTime] = React.useState([0])
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [selectedEvents, setSelectedEvents] = React.useState<TimelineEvent[]>([])
  const [selectedEvent, setSelectedEvent] = React.useState<TimelineEvent | null>(null) // first of selectedEvents for backward compatibility

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

    if (nearbyEvent) {
      const sameTimeEvents = filteredEvents.filter((ev) => Math.abs(ev.time - nearbyEvent.time) < 1)
      setSelectedEvents(sameTimeEvents)
      setSelectedEvent(sameTimeEvents[0] ?? null)
    } else {
      setSelectedEvents([])
      setSelectedEvent(null)
    }
  }

  const jumpToEvent = (event: TimelineEvent) => {
    setCurrentTime([event.time])
    onTimeChange(event.time)

    const sameTimeEvents = filteredEvents.filter((ev) => Math.abs(ev.time - event.time) < 1)
    setSelectedEvents(sameTimeEvents)
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
      <CardContent>
        <div className="space-y-4">
          {/* Title */}
          <h3 className="text-lg font-semibold">Game Timeline</h3>
          {/* Timeline Controls & Event Filter */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Timeline Controls */}
            <div className="flex items-center gap-2">
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

            {/* Event Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Filter:</span>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger size="sm" className="min-w-[160px]">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectSeparator />
                  {EVENT_TYPE_GROUPS.map((grp: { label: string; types: string[] }) => {
                    const swatchColor = eventTypeColors[grp.types[0]] ?? "#6b7280"
                    return (
                      <SelectGroup key={grp.label}>
                        <SelectLabel className="flex items-center gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: swatchColor }}
                          />
                          {grp.label}
                        </SelectLabel>
                        {grp.types.map((t: string) => (
                          <SelectItem key={t} value={t} className="pl-5">
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Legend Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 ml-2 text-sm text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                      Legend
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="bg-zinc-900 text-white p-3 rounded-md shadow-xl border border-border max-w-xs">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                      {/* Scoring Events */}
                      {["goal", "shot"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* Possession Events */}
                      {["puck recovery", "takeaway", "zone entry"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* Face-off Events */}
                      {["faceoff win"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* Penalties */}
                      {["penalty taken"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* General Play Events */}
                      {["play", "incomplete play"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* Dump Events */}
                      {["dump in/out"].filter(type => eventTypeColors[type]).map(type => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}

                      {/* Other Events */}
                      {Object.entries(eventTypeColors).filter(([type]) =>
                        !["goal", "shot", "puck recovery", "takeaway", "zone entry", "faceoff win", "penalty taken", "play", "incomplete play", "dump in/out"].includes(type)
                      ).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Timeline Slider with team labels */}
          <div className="flex items-start">
            {/* Team abbreviation column */}
            <div className="flex flex-col pt-2 mr-2 w-8 shrink-0 select-none">
              <span className="text-[10px] text-muted-foreground text-right">
                {teamAbbr(awayTeamName)}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 text-right">
                {teamAbbr(homeTeamName)}
              </span>
            </div>

            <div className="relative flex-1">
            {/* Period colored bars */}
            <div className="absolute -top-1 w-full h-1 pointer-events-none z-0">
              {periodSegments.map((seg) => {
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
                const color = colors[seg.idx % colors.length]
                const left = (seg.start / maxTime) * 100
                const width = ((seg.end - seg.start) / maxTime) * 100
                return (
                  <div
                    key={seg.idx}
                    className="absolute h-full"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
                  />
                )
              })}
            </div>

            <Slider
              value={currentTime}
              onValueChange={handleTimeChange}
              max={maxTime}
              min={0}
              step={1}
              className="w-full z-20"
            />

            {/* Period separation lines */}
            <div className="absolute top-0 left-0 w-full h-10 pointer-events-none z-10">
              {periodSegments.map((seg, idx) => (
                idx > 0 && (
                  <div
                    key={`period-${idx}`}
                    className="absolute top-0 h-12 border-l border-border text-[10px] text-muted-foreground select-none"
                    style={{ left: `${(seg.start / maxTime) * 100}%` }}
                  >
                    <span className="absolute -top-5 -ml-2">{idx + 1 <= 3 ? `P${idx + 1}` : "OT"}</span>
                  </div>
                )
              ))}
            </div>


            {/* Event Markers (stacked rows by team) */}
            <TooltipProvider>
            <div className="absolute top-2 left-0 w-full h-18 pointer-events-none">
              {/* Divider between team rows */}
              <div
                className="absolute left-0 w-full h-px bg-border"
                style={{ top: "17px" }}
              />
              {filteredEvents.map((event) => {
                const isHome = event.team?.toLowerCase() === (homeTeamName ?? "").toLowerCase()
                const rowOffset = isHome ? 20 : 0 // px for row separation
                return (
                  <Tooltip key={event.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute w-2 h-4 cursor-pointer pointer-events-auto"
                        style={{
                          left: `calc(${(event.time / maxTime) * 100}% - 4px)`,
                          top: `${rowOffset}px`,
                        }}
                        onClick={() => jumpToEvent(event)}
                      >
                        <div
                          className="w-2 h-4 rounded-sm"
                          style={{ backgroundColor: eventTypeColors[event.type] ?? "#6b7280" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-900 text-white p-2 rounded-md text-xs shadow-md border">
                      <div className="space-y-1">
                        <div className="font-medium">{event.type.toUpperCase()} – {formatTime(event.time)}</div>
                        {event.description && <div>{event.description}</div>}
                        {(event.player || event.player_2) && (
                          <div className="text-white/80">
                            {[event.player, event.player_2].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            </TooltipProvider>
            </div>
          </div>

          {/* Event Details Accordion */}
          <details className="bg-muted rounded-lg mt-4 group">
            <summary className="list-none cursor-pointer flex items-center gap-2 p-3 select-none">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
              <span className="font-medium">Event Details</span>
              <span className="text-xs text-muted-foreground">({selectedEvents.length})</span>
            </summary>

            <div className={"flex flex-col gap-2 p-3 pt-0 " + (selectedEvents.length === 0 ? "min-h-[32px]" : "min-h-[60px]")}>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((ev) => (
                <div key={ev.id} className="space-y-1 border-b last:border-b-0 pb-2 last:pb-0">
                  {/* Primary line */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: eventTypeColors[ev.type] ?? "#64748b",
                        color: "white",
                      }}
                    >
                      {ev.type.toUpperCase()}
                    </Badge>
                    {[ev.detail_1, ev.detail_2, ev.detail_3, ev.detail_4]
                      .filter(Boolean)
                      .map((d, idx) => (
                        <span
                          key={`tag-${ev.id}-${idx}`}
                          className="text-xs bg-muted px-1 py-0.5 rounded-sm border border-border text-foreground/90"
                        >
                          {d as string}
                        </span>
                      ))}
                    <span className="text-sm font-medium">{formatTime(ev.time)}</span>
                    <span className="text-sm">{ev.description}</span>
                    {(ev.player || ev.player_2) && (
                      <span className="text-sm text-muted-foreground">
                        ({[ev.player, ev.player_2].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </div>
                  {/* Secondary line */}
                  {(ev.team || ev.home_team_skaters || ev.away_team_skaters) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {ev.team && (
                        <span>
                          Team: <span className="text-foreground font-medium">{ev.team}</span>
                        </span>
                      )}
                      <span>
                        Skaters – Home: <span className="text-foreground font-medium">{ev.home_team_skaters}</span>,
                        Away: <span className="text-foreground font-medium">{ev.away_team_skaters}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">(No Event)</span>
            )}
          </div>
          </details>
          {/* Event Legend */}
          <div className="hidden">
            <h4 className="text-sm font-semibold mb-3">Event Legend</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
              {/* Scoring Events */}
              {["goal", "shot"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* Possession Events */}
              {["puck recovery", "takeaway", "zone entry"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* Face-off Events */}
              {["faceoff win"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* Penalties */}
              {["penalty taken"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* General Play Events */}
              {["play", "incomplete play"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* Dump Events */}
              {["dump in/out"].filter(type => eventTypeColors[type]).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventTypeColors[type] }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
              
              {/* Other Events */}
              {Object.entries(eventTypeColors).filter(([type]) => 
                !["goal", "shot", "puck recovery", "takeaway", "zone entry", "faceoff win", "penalty taken", "play", "incomplete play", "dump in/out"].includes(type)
              ).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
