"use client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

import * as React from "react"

import { fetchGames } from "@/api/games"
import type { Game as ApiGame } from "@/api/games"

interface Game {
  id: number
  homeTeam: string
  awayTeam: string
  date: string
  status: "upcoming" // currently derived dataset has no live/completed status
}

interface GameSelectionProps {
  onGameSelect: (game: Game) => void
}

export function GameSelection({ onGameSelect }: GameSelectionProps) {
  const [games, setGames] = React.useState<Game[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [sortKey, setSortKey] = React.useState<keyof Game | null>(null)
  const [sortAsc, setSortAsc] = React.useState<boolean>(true)

  React.useEffect(() => {
    async function load() {
      try {
        const apiGames = await fetchGames()
        // Transform API shape to component shape expected elsewhere in the app
        const transformed: Game[] = apiGames.map((g: ApiGame) => ({
          id: g.id,
          homeTeam: g.home_team,
          awayTeam: g.away_team,
          date: g.game_date,
          status: "upcoming",
        }))
        setGames(transformed)
      } catch (err: any) {
        setError(err?.message ?? "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sortedGames = React.useMemo(() => {
    if (!sortKey) return games

    return [...games].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue < bValue) return sortAsc ? -1 : 1
      if (aValue > bValue) return sortAsc ? 1 : -1
      return 0
    })
  }, [games, sortKey, sortAsc])

  const handleSort = (key: keyof Game) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const renderSortIndicator = (key: keyof Game) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
    }
    return sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hockey Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">Select a game to analyze</p>
        </div>

        {loading && <p className="text-center">Loading games…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("date")}>
                  <span className="inline-flex items-center gap-1">Date {renderSortIndicator("date")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("awayTeam")}>
                  <span className="inline-flex items-center gap-1">Away Team {renderSortIndicator("awayTeam")}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("homeTeam")}>
                  <span className="inline-flex items-center gap-1">Home Team {renderSortIndicator("homeTeam")}</span>
                </TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    {new Date(game.date).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{game.awayTeam}</TableCell>
                  <TableCell>{game.homeTeam}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() =>
                        onGameSelect({
                          ...game,
                          score: undefined,
                          time: "",
                          venue: "",
                        } as any)
                      }
                    >
                      Analyze Game
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
