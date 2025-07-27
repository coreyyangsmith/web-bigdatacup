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
} from "@/components/ui/select"

import React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  events: Event[]
}

export function GameTable({ events }: Props) {
  const [eventFilter, setEventFilter] = React.useState<string>("all")
  const [teamFilter, setTeamFilter] = React.useState<string>("all")
  const [playerFilter, setPlayerFilter] = React.useState<string>("all")

  const uniqueEvents = React.useMemo(() => {
    const set = new Set(events.map((e) => e.event))
    return Array.from(set.values()).filter(Boolean)
  }, [events])

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
      if (eventFilter !== "all" && e.event !== eventFilter) return false
      if (teamFilter !== "all" && e.team !== teamFilter) return false
      if (playerFilter !== "all" && e.player !== playerFilter) return false
      return true
    })
  }, [events, eventFilter, teamFilter, playerFilter])

  const totalGoals = filteredEvents.filter((e) => e.event?.toLowerCase() === "goal").length
  const totalShots = filteredEvents.filter((e) => e.event?.toLowerCase() === "shot").length

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Goals</CardDescription>
            <CardTitle className="text-2xl">{totalGoals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shots</CardDescription>
            <CardTitle className="text-2xl">{totalShots}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Play-by-Play Events</CardTitle>
            <CardDescription>Filter by event type or team</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Event filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Event:</span>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger size="sm" className="min-w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueEvents.map((evt) => (
                    <SelectItem key={evt} value={evt}>{evt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Player filter (shown only when a team is selected) */}
            {teamFilter !== "all" && (
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
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[60vh]">
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
                  <TableCell>{ev.event}</TableCell>
                  <TableCell>{ev.detail_1 ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {sortedEvents.length} events
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
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
        </CardContent>
      </Card>
    </div>
  )
}
