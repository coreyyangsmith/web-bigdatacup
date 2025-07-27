"use client"

import * as React from "react"
import { GameSelection } from "../components/game-selection"
import { AppSidebar } from "../components/app-sidebar"
import { PannableHockeyRink } from "../components/rink/pannable-hockey-rink"
import { GameTable } from "../components/game-table"

import { fetchGameEvents } from "@/api/games"
import type { Event as GameEvent } from "@/api/games"
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
  const rinkRef = React.useRef<() => void>(null)

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
        const evs = await fetchGameEvents(selectedGame.id)
        setEvents(evs)
      } catch (err: any) {
        setEventsError(err?.message ?? "Failed to load events")
      } finally {
        setLoadingEvents(false)
      }
    }

    load()
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
                    <div>
                      <CardTitle>Hockey Rink Visualization</CardTitle>
                      <CardDescription>
                        Interactive hockey rink with overlaid analytics data - drag to pan, scroll to zoom
                      </CardDescription>
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
                      ref={rinkRef}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex-none">
                <TimelineScrubber onTimeChange={setCurrentTime} />
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
