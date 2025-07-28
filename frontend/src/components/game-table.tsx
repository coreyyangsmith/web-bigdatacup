import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import type { Event } from "@/api/games"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"

import React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  events: Event[]
  eventTypeColors: Record<string, string>
}

export function GameTable({ events, eventTypeColors }: Props) {
  const [eventFilter, setEventFilter] = React.useState<string>("all")
  const [teamFilter, setTeamFilter] = React.useState<string>("all")
  const [playerFilter, setPlayerFilter] = React.useState<string>("all")

  const uniqueEvents = React.useMemo(() => {
    const set = new Set(events.map((e) => (e.event ?? "").toLowerCase()))
    return Array.from(set.values()).filter(Boolean)
  }, [events])

  // Match timeline dropdown grouping
  const EVENT_TYPE_GROUPS: { label: string; types: string[] }[] = [
    { label: "Scoring Events", types: ["goal", "shot"] },
    { label: "Possession Events", types: ["puck recovery", "takeaway", "zone entry"] },
    { label: "Face-off Events", types: ["faceoff win"] },
    { label: "Penalties", types: ["penalty taken"] },
    { label: "General Play", types: ["play", "incomplete play"] },
    { label: "Dump Events", types: ["dump in/out"] },
  ]

  const groupedTypesSet = new Set(EVENT_TYPE_GROUPS.flatMap((g) => g.types))
  const otherEventTypes = uniqueEvents.filter((t) => !groupedTypesSet.has(t))

  const uniqueTeams = React.useMemo(() => {
    const set = new Set(events.map((e) => e.team))
    return Array.from(set.values()).filter(Boolean)
  }, [events])

  const uniquePlayers = React.useMemo(() => {
    const relevant = teamFilter === "all" ? events : events.filter((e) => e.team === teamFilter)
    const set = new Set(relevant.map((e) => e.player))
    return Array.from(set.values()).filter(Boolean)
  }, [events, teamFilter])

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      // Normalize for case-insensitive comparison
      const evType = (e.event ?? "").toLowerCase()
      const tm = e.team ?? ""
      const pl = e.player ?? ""

      if (eventFilter !== "all" && evType !== eventFilter) return false
      if (teamFilter !== "all" && tm !== teamFilter) return false
      if (playerFilter !== "all" && pl !== playerFilter) return false
      return true
    })
  }, [events, eventFilter, teamFilter, playerFilter])

  const totalGoals = filteredEvents.filter((e) => e.event?.toLowerCase() === "goal").length
  const totalShots = filteredEvents.filter((e) => e.event?.toLowerCase() === "shot").length
  const totalPenalties = filteredEvents.filter((e) => {
    const ev = e.event?.toLowerCase() ?? ""
    return ev.includes("penalty")
  }).length

  const shotAccuracy = totalShots > 0 ? (totalGoals / totalShots) * 100 : 0
  // ---------------- Sorting -----------------
  type SortableKeys = "period" | "clock" | "team" | "player" | "event"

  const [sortKey, setSortKey] = React.useState<SortableKeys>("period")
  const [sortAsc, setSortAsc] = React.useState<boolean>(true)

  const sortedEvents = React.useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aVal = a[sortKey] as any
      const bVal = b[sortKey] as any
      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredEvents, sortKey, sortAsc])

  // ---------------- Pagination -----------------
  const PAGE_SIZE = 50
  const [page, setPage] = React.useState<number>(1)

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / PAGE_SIZE))

  const pagedEvents = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sortedEvents.slice(start, start + PAGE_SIZE)
  }, [sortedEvents, page])

  // Reset to first page when filter or sort changes
  React.useEffect(() => {
    setPage(1)
  }, [eventFilter, teamFilter, playerFilter, sortKey, sortAsc])

  const handleSort = (key: SortableKeys) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const renderSortIndicator = (key: SortableKeys) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
    }
    return sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shots</CardDescription>
            <CardTitle className="text-2xl">{totalShots}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Goals</CardDescription>
            <CardTitle className="text-2xl">{totalGoals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shot Accuracy (%)</CardDescription>
            <CardTitle className="text-2xl">{shotAccuracy.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Penalties</CardDescription>
            <CardTitle className="text-2xl">{totalPenalties}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">{/* Fill available space and allow internal scrolling */}
        {/* Sticky Header: title row with pagination, and filters row */}
        <CardHeader className="space-y-4 sticky top-0 bg-background z-10">
          {/* Title + Pagination Row */}
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Play-by-Play Events</CardTitle>
              <CardDescription>Filter by event, team, or player</CardDescription>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Team filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Team:</span>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger size="sm" className="min-w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueTeams.map((tm) => (
                    <SelectItem key={tm} value={tm}>{tm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Player filter (always visible) */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Player:</span>
              <Select value={playerFilter} onValueChange={setPlayerFilter}>
                <SelectTrigger size="sm" className="min-w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniquePlayers.map((pl) => (
                    <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event filter aligned right */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm">Event:</span>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger size="sm" className="min-w-[160px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectSeparator />
                  {EVENT_TYPE_GROUPS.map((grp) => {
                    const swatchColor = eventTypeColors[grp.types[0]] ?? "#6b7280"
                    return (
                      <SelectGroup key={grp.label}>
                        <SelectLabel className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: swatchColor }} />
                          {grp.label}
                        </SelectLabel>
                        {grp.types.map((t) => (
                          <SelectItem key={t} value={t} className="pl-5">
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}

                  {/* Other events */}
                  {otherEventTypes.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Other Events</SelectLabel>
                        {otherEventTypes.map((t) => (
                          <SelectItem key={t} value={t} className="pl-5">
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        {/* Scrollable table region */}
        <CardContent className="overflow-auto flex-1 min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("period")}> 
                  <span className="inline-flex items-center gap-1">Period {renderSortIndicator("period")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("clock")}> 
                  <span className="inline-flex items-center gap-1">Clock {renderSortIndicator("clock")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("team")}> 
                  <span className="inline-flex items-center gap-1">Team {renderSortIndicator("team")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("player")}> 
                  <span className="inline-flex items-center gap-1">Player {renderSortIndicator("player")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("event")}> 
                  <span className="inline-flex items-center gap-1">Event {renderSortIndicator("event")}</span>
                </TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEvents.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>{ev.period}</TableCell>
                  <TableCell>{ev.clock}</TableCell>
                  <TableCell>{ev.team}</TableCell>
                  <TableCell>{ev.player}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: eventTypeColors[(ev.event ?? "").toLowerCase()] ?? "#6b7280" }}
                      />
                      {ev.event}
                    </div>
                  </TableCell>
                  <TableCell>{ev.detail_1 ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
