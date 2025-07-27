"use client"

import * as React from "react"
import { GameSelection } from "../components/game-selection"
import { AppSidebar } from "../components/app-sidebar"
import { PannableHockeyRink } from "../components/rink/pannable-hockey-rink"
import { GameTable } from "../components/game-table"

import { fetchGameEvents, fetchGameShotDensity, fetchGameGoalDensity, fetchEventTypes, fetchPlayers } from "@/api/games"
import type { Event as GameEvent, ShotCoordinate } from "@/api/games"
import type { PlayerInfo } from "@/api/games"
import { TimelineScrubber } from "../components/timeline-scrubber"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, FullscreenIcon as FullScreen, ZoomIn, ZoomOut } from "lucide-react"
import { toast } from "react-toastify"
import { getEventTypeColorMap } from "@/themes/event-colors"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function HockeyDashboard() {
  const [selectedGame, setSelectedGame] = React.useState<any>(null)
  const [viewMode, setViewMode] = React.useState<"rink" | "table">("rink")
  const [currentTime, setCurrentTime] = React.useState(0)
  const [opacity, setOpacity] = React.useState(75)
  const [showGrid, setShowGrid] = React.useState(true)
  const [showZones, setShowZones] = React.useState(true)
  const [showNumbers, setShowNumbers] = React.useState(true)
  const [events, setEvents] = React.useState<GameEvent[] | null>(null)
  const [loadingEvents, setLoadingEvents] = React.useState(false)
  const [eventsError, setEventsError] = React.useState<string | null>(null)
  const [shotCoords, setShotCoords] = React.useState<ShotCoordinate[] | null>(null)
  const [goalCoords, setGoalCoords] = React.useState<ShotCoordinate[] | null>(null)
  const [selectedPlayer, setSelectedPlayer] = React.useState<string>("all")
  const [eventTypeColors, setEventTypeColors] = React.useState<Record<string, string>>({})
  const [homeColor, setHomeColor] = React.useState<string>(import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb")
  const [awayColor, setAwayColor] = React.useState<string>(import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626")
  const [playerNumbers, setPlayerNumbers] = React.useState<Record<string, number | null>>({})
  const [gamePlayers, setGamePlayers] = React.useState<PlayerInfo[]>([])
  const [playerTeamMap, setPlayerTeamMap] = React.useState<Record<string, string>>({})
  const rinkRef = React.useRef<() => void>(null)
  const [visualizations, setVisualizations] = React.useState({
    shotDensity: true,
    goalDensity: true,
    expectedGoalDensity: false,
    successfulPass: false,
    unsuccessfulPass: false,
    entryRoutes: false,
    possessionChain: false,
    penaltyLocation: false,
  })

  const PERIOD_SECONDS = 20 * 60
  const clockToSecondsRemaining = (clock: string): number => {
    const [minStr, secStr] = clock.split(":")
    return parseInt(minStr, 10) * 60 + parseInt(secStr, 10)
  }

  const computeAbsoluteTime = (ev: GameEvent): number => {
    const secRemaining = clockToSecondsRemaining(ev.clock)
    const elapsed = PERIOD_SECONDS - secRemaining
    return (ev.period - 1) * PERIOD_SECONDS + elapsed
  }

  const teamAbbr = React.useCallback((teamName: string | undefined | null): string => {
    if (!teamName) return "";
    const seg = teamName.split("-").pop()?.trim() ?? teamName;
    const letters = seg.replace(/[^A-Za-z]/g, "").toUpperCase();
    if (letters.length >= 3) return letters.slice(0, 3);
    return (letters + "XXX").slice(0, 3);
  }, []);

  const activeEvents = React.useMemo(() => {
    if (!events) return []
    return events.filter((ev) => {
      if (selectedPlayer !== "all" && ev.player?.toLowerCase() !== selectedPlayer.toLowerCase()) return false
      return Math.abs(computeAbsoluteTime(ev) - currentTime) < 1
    })
  }, [events, currentTime, selectedPlayer])

  const handleExportData = () => {
    try {
      // Create sample data for export
      const exportData = {
        game: {
          homeTeam: selectedGame.homeTeam,
          awayTeam: selectedGame.awayTeam,
          date: selectedGame.date,
          score: selectedGame.score,
        },
        currentTime: currentTime,
        visualizations: {
          opacity: opacity,
          timestamp: new Date().toISOString(),
        },
        players: [
          { name: "A. Matthews", team: "home", goals: 2, assists: 1, shots: 6 },
          { name: "M. Marner", team: "home", goals: 1, assists: 2, shots: 4 },
          { name: "D. Pastrnak", team: "away", goals: 1, assists: 0, shots: 5 },
          { name: "B. Marchand", team: "away", goals: 1, assists: 1, shots: 3 },
        ],
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `hockey-analytics-${selectedGame.homeTeam}-vs-${selectedGame.awayTeam}-${new Date()
        .toISOString()
        .split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Game analytics data has been downloaded as JSON file.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to export game analytics data. Please try again.")
    }
  }

  const handleResetView = () => {
    setCurrentTime(0)
    setOpacity(75)
    // Reset rink view if in rink mode
    if (viewMode === "rink" && rinkRef.current) {
      rinkRef.current()
    }

    toast.success("All settings and view position have been reset to defaults.", {
      position: "top-right",
    })
  }

  // Load events when game selected changes
  React.useEffect(() => {
    if (!selectedGame) return

    async function load() {
      setLoadingEvents(true)
      setEventsError(null)
      try {
        const [evs, shots, goals, eventTypes] = await Promise.all([
          fetchGameEvents(selectedGame.id),
          fetchGameShotDensity(selectedGame.id),
          fetchGameGoalDensity(selectedGame.id),
          fetchEventTypes(),
        ])
        setEvents(evs)
        setShotCoords(shots)
        setGoalCoords(goals)
        // Build unique player list
        const unique = Array.from(new Set(evs.map((e) => e.player).filter(Boolean))) as string[]
        unique.sort((a, b) => a.localeCompare(b))
        // Build color mapping
        setEventTypeColors(getEventTypeColorMap(eventTypes))

        const playersList = await fetchPlayers()

        // Filter to players present in this game's events
        const involved: Set<string> = new Set()
        const teamMap: Record<string, string> = {}
        evs.forEach((ev) => {
          if (ev.player) involved.add(ev.player.trim().toLowerCase())
          if (ev.player_2) involved.add(ev.player_2.trim().toLowerCase())

          if (ev.player) teamMap[ev.player.trim().toLowerCase()] = ev.team
          if (ev.player_2) teamMap[ev.player_2.trim().toLowerCase()] = ev.team
        })
        setPlayerTeamMap(teamMap)

        const filteredPlayers = playersList.filter((p) => involved.has(p.name.trim().toLowerCase()))
        setGamePlayers(filteredPlayers)

        const numMap: Record<string, number | null> = {}
        playersList.forEach((p: PlayerInfo) => {
          numMap[p.name.trim().toLowerCase()] = p.number ?? null
        })
        setPlayerNumbers(numMap)
      } catch (err: any) {
        setEventsError(err?.message ?? "Failed to load events")
      } finally {
        setLoadingEvents(false)
      }
    }

    load()
  }, [selectedGame])

  // --- Initialise default team colours from .env when game changes ---------
  React.useEffect(() => {
    if (!selectedGame) return

    const slug = (name: string) =>
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")

    // Build candidate env keys (try full name, then last segment after final hyphen)
    const buildKeys = (teamName: string): string[] => {
      const full = `VITE_TEAM_COLOR_${slug(teamName)}`
      const parts = teamName.split("-")
      const last = parts[parts.length - 1].trim()
      const simple = `VITE_TEAM_COLOR_${slug(last)}`
      return [full, simple]
    }

    const envObj: Record<string, string | undefined> = (import.meta as any).env ?? import.meta.env

    const resolveColor = (keys: string[], fallback: string) => {
      for (const k of keys) {
        const val = envObj[k]
        if (val) return val
      }
      return fallback
    }

    setHomeColor(
      resolveColor(buildKeys(selectedGame.homeTeam), import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb")
    )
    setAwayColor(
      resolveColor(buildKeys(selectedGame.awayTeam), import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626")
    )
  }, [selectedGame])

  if (!selectedGame) {
    return <GameSelection onGameSelect={setSelectedGame} />
  }

  return (
    <SidebarProvider>
      <AppSidebar
        selectedGame={selectedGame}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        opacity={opacity}
        onOpacityChange={setOpacity}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        showZones={showZones}
        onShowZonesChange={setShowZones}
        showNumbers={showNumbers}
        onShowNumbersChange={setShowNumbers}
        visualizations={visualizations}
        onVisualizationsChange={setVisualizations}
        homeColor={homeColor}
        awayColor={awayColor}
        onHomeColorChange={setHomeColor}
        onAwayColorChange={setAwayColor}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#" onClick={() => setSelectedGame(null)}>
                  All Games
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {selectedGame.awayTeam} @ {selectedGame.homeTeam}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedGame(null)}>
              <ArrowLeft className="h-4 w-4" />
              Back to Games
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 overflow-hidden">
          {viewMode === "rink" && (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Shots</CardDescription>
                    <CardTitle className="text-2xl">
                      {events ? events.filter((e) => e.event?.toLowerCase() === "shot").length : "-"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Goals</CardDescription>
                    <CardTitle className="text-2xl">
                      {events ? events.filter((e) => e.event?.toLowerCase() === "goal").length : "-"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Possession Time</CardDescription>
                    <CardTitle className="text-2xl">12:34</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Zone Entries</CardDescription>
                    <CardTitle className="text-2xl">23</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card className="flex-1 flex flex-col overflow-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle>Hockey Rink Visualization</CardTitle>
                      <CardDescription>
                        Interactive hockey rink with overlaid analytics data - drag to pan, scroll to zoom
                      </CardDescription>
                    </div>

                    {/* Player Analysis Select */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Player:</Label>
                      <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue placeholder="All Players" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Players</SelectItem>
                          <SelectSeparator />
                          {gamePlayers.map((p) => (
                            <SelectItem key={p.id} value={p.name.toLowerCase()}>
                              {teamAbbr(playerTeamMap[p.name.toLowerCase()])} - {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-auto">
                  <div className="w-full h-full">
                    <PannableHockeyRink
                      width={1000}
                      height={400}
                      showGrid={showGrid}
                      showZones={showZones}
                      showNumbers={showNumbers}
                      currentTime={currentTime}
                      opacity={opacity}
                      selectedGame={selectedGame}
                      shotCoordinates={shotCoords ?? []}
                      goalCoordinates={goalCoords ?? []}
                      playerNumbers={playerNumbers}
                      homeColor={homeColor}
                      awayColor={awayColor}
                      visualizations={visualizations}
                      activeEvents={activeEvents}
                      ref={rinkRef}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex-none">
                <TimelineScrubber
                  events={events}
                  selectedPlayer={selectedPlayer}
                  eventTypeColors={eventTypeColors}
                  onTimeChange={setCurrentTime}
                />
              </div>
            </>
          )}

          {viewMode === "table" && (
            <>
              {loadingEvents && <p>Loading events…</p>}
              {eventsError && <p className="text-red-500">{eventsError}</p>}
              {events && <GameTable events={events} />}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
