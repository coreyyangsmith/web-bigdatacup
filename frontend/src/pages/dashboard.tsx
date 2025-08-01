import * as React from "react"
import { GameSelection } from "../components/game-selection"
import { AppSidebar } from "../components/app-sidebar"
import { PannableHockeyRink } from "../components/rink/pannable-hockey-rink"
import { GameTable } from "../components/game-table"

import { fetchGameEvents, fetchGameShotDensity, fetchGameGoalDensity, fetchEventTypes, fetchPlayers, exportGameData } from "@/api/games"
import type { Event as GameEvent, ShotCoordinate, GameExport } from "@/api/games"
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
import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download } from "lucide-react"
import { toast } from "react-toastify"
import { getEventTypeColorMap } from "@/themes/event-colors"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [selectedTeam, setSelectedTeam] = React.useState<string>("all")
  const [selectedPlayer, setSelectedPlayer] = React.useState<string>("all")
  const [eventTypeColors, setEventTypeColors] = React.useState<Record<string, string>>({})
  const [homeColor, setHomeColor] = React.useState<string>(import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb")
  const [awayColor, setAwayColor] = React.useState<string>(import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626")
  const [playerNumbers, setPlayerNumbers] = React.useState<Record<string, number | null>>({})
  const [gamePlayers, setGamePlayers] = React.useState<PlayerInfo[]>([])
  const [playerTeamMap, setPlayerTeamMap] = React.useState<Record<string, string>>({})
  const rinkRef = React.useRef<() => void>(null)

  // Derived coordinates filtered by selected player
  const normalize = (name: string | null | undefined) => name?.trim().toLowerCase() ?? ""

  const filteredShotCoords = React.useMemo<ShotCoordinate[]>(() => {
    if (!events) return []

    // Player level filtering
    if (selectedPlayer !== "all") {
      return events
        .filter(
          (e) =>
            e.event?.toLowerCase() === "shot" &&
            (normalize(e.player) === selectedPlayer || normalize(e.player_2) === selectedPlayer) &&
            e.x_coordinate !== null &&
            e.y_coordinate !== null
        )
        .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
    }

    // Team level filtering
    if (selectedTeam !== "all") {
      return events
        .filter(
          (e) =>
            e.event?.toLowerCase() === "shot" &&
            e.team?.toLowerCase() === selectedTeam.toLowerCase() &&
            e.x_coordinate !== null &&
            e.y_coordinate !== null
        )
        .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
    }

    // No filters – return all precomputed shots if available else derive
    if (shotCoords) return shotCoords

    return events
      .filter((e) => e.event?.toLowerCase() === "shot" && e.x_coordinate !== null && e.y_coordinate !== null)
      .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
  }, [shotCoords, events, selectedPlayer, selectedTeam])

  const filteredGoalCoords = React.useMemo<ShotCoordinate[]>(() => {
    if (!events) return []

    if (selectedPlayer !== "all") {
      return events
        .filter(
          (e) =>
            e.event?.toLowerCase() === "goal" &&
            (normalize(e.player) === selectedPlayer || normalize(e.player_2) === selectedPlayer) &&
            e.x_coordinate !== null &&
            e.y_coordinate !== null
        )
        .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
    }

    if (selectedTeam !== "all") {
      return events
        .filter(
          (e) =>
            e.event?.toLowerCase() === "goal" &&
            e.team?.toLowerCase() === selectedTeam.toLowerCase() &&
            e.x_coordinate !== null &&
            e.y_coordinate !== null
        )
        .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
    }

    if (goalCoords) return goalCoords

    return events
      .filter((e) => e.event?.toLowerCase() === "goal" && e.x_coordinate !== null && e.y_coordinate !== null)
      .map((e) => ({ x: e.x_coordinate as number, y: e.y_coordinate as number }))
  }, [goalCoords, events, selectedPlayer, selectedTeam])

  const [visualizations, setVisualizations] = React.useState({
    shotDensity: false,
    goalDensity: false,
    successfulPass: false,
    unsuccessfulPass: false,
    eventHeatmap: false,
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

  // ---------------- Derived Stats (shots, goals, etc.) -------------------
  const playerStats = React.useMemo(() => {
    if (!events) {
      return { shots: 0, goals: 0, shotAccuracy: 0, penalties: 0 }
    }

    // Determine relevant events based on current filters
    let relevantEvents: GameEvent[] = events

    if (selectedPlayer !== "all") {
      const normalizedPlayer = selectedPlayer.toLowerCase()
      relevantEvents = events.filter((e) => e.player?.toLowerCase() === normalizedPlayer)
    } else if (selectedTeam !== "all") {
      relevantEvents = events.filter((e) => e.team?.toLowerCase() === selectedTeam.toLowerCase())
    }

    const shots = relevantEvents.filter((e) => e.event?.toLowerCase() === "shot").length
    const goals = relevantEvents.filter((e) => e.event?.toLowerCase() === "goal").length
    const penalties = relevantEvents.filter((e) => {
      const ev = e.event?.toLowerCase() ?? ""
      return ev.includes("penalty")
    }).length

    const shotAccuracy = shots > 0 ? (goals / shots) * 100 : 0

    return { shots, goals, shotAccuracy, penalties }
  }, [events, selectedPlayer, selectedTeam])

  // Helper to format seconds as MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
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
      if (selectedPlayer === "all" && selectedTeam !== "all" && ev.team?.toLowerCase() !== selectedTeam.toLowerCase()) return false
      return Math.abs(computeAbsoluteTime(ev) - currentTime) < 1
    })
  }, [events, currentTime, selectedPlayer, selectedTeam])

  const handleExportData = async () => {
    if (!selectedGame) return

    try {
      const exportData: GameExport = await exportGameData(selectedGame.id)

      // Build filename with date part of game_date or today fallback
      const dateStr = (exportData.game.game_date || new Date().toISOString()).split("T")[0]
      const filename = `hockey-analytics-${exportData.game.home_team}-vs-${exportData.game.away_team}-${dateStr}.json`

      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Game data has been downloaded.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to export game data. Please try again.")
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
              {/* Controls Section */}
              <div className="space-y-4 flex-none">


                {/* Team & Player Analysis Controls */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>Hockey Rink Visualization</CardTitle>
                        <CardDescription>
                          Interactive hockey rink with overlaid analytics data - drag to pan, scroll to zoom
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Team Select */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Team:</Label>
                          <Select
                            value={selectedTeam}
                            onValueChange={(val) => {
                              setSelectedTeam(val)
                              setSelectedPlayer("all") // reset player when team changes
                            }}
                          >
                            <SelectTrigger className="w-48 h-8">
                              <SelectValue placeholder="All Teams" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Teams</SelectItem>
                              <SelectSeparator />
                              <SelectItem value={selectedGame.homeTeam.toLowerCase()}>{selectedGame.homeTeam}</SelectItem>
                              <SelectItem value={selectedGame.awayTeam.toLowerCase()}>{selectedGame.awayTeam}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Player Select */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Player:</Label>
                          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue placeholder="All Players" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Players</SelectItem>
                              <SelectSeparator />
                              {gamePlayers
                                .filter((p) => selectedTeam === "all" || playerTeamMap[p.name.toLowerCase()]?.toLowerCase() === selectedTeam.toLowerCase())
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.name.toLowerCase()}>
                                    {teamAbbr(playerTeamMap[p.name.toLowerCase()])} - {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
                {/* Stats Cards */}
                <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-4">
                  <Card>
                    <CardHeader className="">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-xs">Total Shots</CardDescription>
                        <CardTitle className="text-xl">
                          {events ? playerStats.shots : "-"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-xs">Goals</CardDescription>
                        <CardTitle className="text-xl">
                          {events ? playerStats.goals : "-"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-xs">Shot Accuracy (%)</CardDescription>
                        <CardTitle className="text-xl">
                          {events ? playerStats.shotAccuracy.toFixed(1) : "-"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-xs">Penalties</CardDescription>
                        <CardTitle className="text-xl">
                          {events ? playerStats.penalties : "-"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              {/* Hockey Rink - Takes up remaining space */}
              <div className="flex-1 min-h-0">
                <PannableHockeyRink
                  width={1000}
                  height={400}
                  showGrid={showGrid}
                  showZones={showZones}
                  showNumbers={showNumbers}
                  currentTime={currentTime}
                  opacity={opacity}
                  selectedGame={selectedGame}
                  shotCoordinates={filteredShotCoords}
                  goalCoordinates={filteredGoalCoords}
                  playerNumbers={playerNumbers}
                  homeColor={homeColor}
                  awayColor={awayColor}
                  visualizations={visualizations}
                  activeEvents={activeEvents}
                  events={events ?? []}
                  eventColors={eventTypeColors}
                  selectedTeam={selectedTeam}
                  selectedPlayer={selectedPlayer}
                  ref={rinkRef}
                />
              </div>

              <div className="flex-none">
                <TimelineScrubber
                  events={events}
                  selectedPlayer={selectedPlayer}
                  selectedTeam={selectedTeam}
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
              {events && <GameTable events={events} eventTypeColors={eventTypeColors} />}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
