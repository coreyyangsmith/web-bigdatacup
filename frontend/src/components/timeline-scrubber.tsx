import * as React from "react"
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GameEvent {
  id: string
  time: number // in seconds
  period: number
  type: "goal" | "shot" | "hit" | "penalty" | "faceoff"
  description: string
  team: "home" | "away"
  player?: string
}

const gameEvents: GameEvent[] = [
  { id: "1", time: 120, period: 1, type: "goal", description: "Matthews scores", team: "home", player: "A. Matthews" },
  {
    id: "2",
    time: 340,
    period: 1,
    type: "penalty",
    description: "Tripping - 2 min",
    team: "away",
    player: "B. Marchand",
  },
  { id: "3", time: 480, period: 1, type: "goal", description: "Pastrnak scores", team: "away", player: "D. Pastrnak" },
  { id: "4", time: 720, period: 2, type: "shot", description: "Shot on goal", team: "home", player: "M. Marner" },
  { id: "5", time: 890, period: 2, type: "goal", description: "Marner scores", team: "home", player: "M. Marner" },
  { id: "6", time: 1200, period: 2, type: "hit", description: "Big hit", team: "away", player: "C. McAvoy" },
  { id: "7", time: 1450, period: 3, type: "goal", description: "Nylander scores", team: "home", player: "W. Nylander" },
  {
    id: "8",
    time: 1680,
    period: 3,
    type: "penalty",
    description: "High sticking - 2 min",
    team: "home",
    player: "J. Tavares",
  },
]

interface TimelineScrubberProps {
  onTimeChange: (time: number) => void
}

export function TimelineScrubber({ onTimeChange }: TimelineScrubberProps) {
  const [currentTime, setCurrentTime] = React.useState([0])
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<GameEvent | null>(null)

  const maxTime = 1800 // 30 minutes (3 periods of 10 minutes each for demo)

  const formatTime = (seconds: number) => {
    const period = Math.floor(seconds / 600) + 1
    const timeInPeriod = seconds % 600
    const minutes = Math.floor(timeInPeriod / 60)
    const secs = Math.floor(timeInPeriod % 60)
    return `P${period} ${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value)
    onTimeChange(value[0])

    // Check if we're near an event
    const nearbyEvent = gameEvents.find((event) => Math.abs(event.time - value[0]) < 10)
    setSelectedEvent(nearbyEvent || null)
  }

  const jumpToEvent = (event: GameEvent) => {
    setCurrentTime([event.time])
    onTimeChange(event.time)
    setSelectedEvent(event)
  }

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
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, maxTime, onTimeChange])

  const getPreviousEvent = () => {
    return gameEvents.filter((event) => event.time < currentTime[0]).sort((a, b) => b.time - a.time)[0]
  }

  const getNextEvent = () => {
    return gameEvents.filter((event) => event.time > currentTime[0]).sort((a, b) => a.time - b.time)[0]
  }

  const jumpToPreviousEvent = () => {
    const prevEvent = getPreviousEvent()
    if (prevEvent) {
      jumpToEvent(prevEvent)
    }
  }

  const jumpToNextEvent = () => {
    const nextEvent = getNextEvent()
    if (nextEvent) {
      jumpToEvent(nextEvent)
    }
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
            <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
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

            {/* Event Markers */}
            <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
              {gameEvents.map((event) => (
                <div
                  key={event.id}
                  className="absolute top-0 w-2 h-6 cursor-pointer pointer-events-auto"
                  style={{ left: `${(event.time / maxTime) * 100}%` }}
                  onClick={() => jumpToEvent(event)}
                >
                  <div
                    className={`w-2 h-6 rounded-sm ${
                      event.type === "goal"
                        ? "bg-green-500"
                        : event.type === "penalty"
                          ? "bg-red-500"
                          : event.type === "shot"
                            ? "bg-blue-500"
                            : event.type === "hit"
                              ? "bg-orange-500"
                              : "bg-gray-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Event Details */}
          {selectedEvent && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Badge
                variant={
                  selectedEvent.type === "goal"
                    ? "default"
                    : selectedEvent.type === "penalty"
                      ? "destructive"
                      : "secondary"
                }
              >
                {selectedEvent.type.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium">{formatTime(selectedEvent.time)}</span>
              <span className="text-sm">{selectedEvent.description}</span>
              {selectedEvent.player && <span className="text-sm text-muted-foreground">({selectedEvent.player})</span>}
            </div>
          )}

          {/* Event Legend */}
          <div className="flex items-center gap-4 mt-8 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Goals</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              <span>Penalties</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span>Shots</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
              <span>Hits</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
