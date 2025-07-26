"use client"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  venue: string
  status: "completed" | "live" | "upcoming"
  score?: { home: number; away: number }
}

const sampleGames: Game[] = [
  {
    id: "1",
    homeTeam: "Toronto Maple Leafs",
    awayTeam: "Boston Bruins",
    date: "2024-01-26",
    time: "7:00 PM",
    venue: "Scotiabank Arena",
    status: "completed",
    score: { home: 4, away: 2 },
  },
  {
    id: "2",
    homeTeam: "Montreal Canadiens",
    awayTeam: "Ottawa Senators",
    date: "2024-01-26",
    time: "7:30 PM",
    venue: "Bell Centre",
    status: "live",
    score: { home: 2, away: 1 },
  },
  {
    id: "3",
    homeTeam: "Calgary Flames",
    awayTeam: "Edmonton Oilers",
    date: "2024-01-27",
    time: "9:00 PM",
    venue: "Saddledome",
    status: "upcoming",
  },
  {
    id: "4",
    homeTeam: "New York Rangers",
    awayTeam: "Philadelphia Flyers",
    date: "2024-01-25",
    time: "7:00 PM",
    venue: "Madison Square Garden",
    status: "completed",
    score: { home: 3, away: 1 },
  },
]

interface GameSelectionProps {
  onGameSelect: (game: Game) => void
}

export function GameSelection({ onGameSelect }: GameSelectionProps) {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hockey Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">Select a game to analyze</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sampleGames.map((game) => (
            <Card key={game.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {game.awayTeam} @ {game.homeTeam}
                  </CardTitle>
                  <Badge
                    variant={
                      game.status === "live" ? "destructive" : game.status === "completed" ? "secondary" : "outline"
                    }
                  >
                    {game.status === "live" ? "LIVE" : game.status === "completed" ? "Final" : "Upcoming"}
                  </Badge>
                </div>
                {game.score && (
                  <div className="text-2xl font-bold">
                    {game.awayTeam.split(" ").pop()} {game.score.away} - {game.score.home}{" "}
                    {game.homeTeam.split(" ").pop()}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(game.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {game.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {game.venue}
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={() => onGameSelect(game)}>
                  Analyze Game
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
