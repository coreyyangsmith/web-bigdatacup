import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const playerStats = [
  {
    player: "Auston Matthews",
    team: "TOR",
    position: "C",
    goals: 2,
    assists: 1,
    shots: 6,
    hits: 2,
    timeOnIce: "18:45",
    plusMinus: "+2",
  },
  {
    player: "Mitch Marner",
    team: "TOR",
    position: "RW",
    goals: 1,
    assists: 2,
    shots: 4,
    hits: 1,
    timeOnIce: "19:12",
    plusMinus: "+1",
  },
  {
    player: "David Pastrnak",
    team: "BOS",
    position: "RW",
    goals: 1,
    assists: 0,
    shots: 5,
    hits: 3,
    timeOnIce: "17:33",
    plusMinus: "-1",
  },
  {
    player: "Brad Marchand",
    team: "BOS",
    position: "LW",
    goals: 1,
    assists: 1,
    shots: 3,
    hits: 4,
    timeOnIce: "16:28",
    plusMinus: "0",
  },
  {
    player: "William Nylander",
    team: "TOR",
    position: "RW",
    goals: 1,
    assists: 0,
    shots: 3,
    hits: 0,
    timeOnIce: "16:45",
    plusMinus: "+1",
  },
  {
    player: "Charlie McAvoy",
    team: "BOS",
    position: "D",
    goals: 0,
    assists: 1,
    shots: 2,
    hits: 5,
    timeOnIce: "22:15",
    plusMinus: "-1",
  },
]

export function GameTable() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Goals</CardDescription>
            <CardTitle className="text-2xl">6</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shots</CardDescription>
            <CardTitle className="text-2xl">47</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Power Plays</CardDescription>
            <CardTitle className="text-2xl">3/7</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Faceoff %</CardDescription>
            <CardTitle className="text-2xl">52%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>Individual player performance data for this game</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead className="text-center">G</TableHead>
                <TableHead className="text-center">A</TableHead>
                <TableHead className="text-center">SOG</TableHead>
                <TableHead className="text-center">Hits</TableHead>
                <TableHead className="text-center">TOI</TableHead>
                <TableHead className="text-center">+/-</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((player) => (
                <TableRow key={player.player}>
                  <TableCell className="font-medium">{player.player}</TableCell>
                  <TableCell>
                    <Badge variant={player.team === "TOR" ? "default" : "secondary"}>{player.team}</Badge>
                  </TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell className="text-center">{player.goals}</TableCell>
                  <TableCell className="text-center">{player.assists}</TableCell>
                  <TableCell className="text-center">{player.shots}</TableCell>
                  <TableCell className="text-center">{player.hits}</TableCell>
                  <TableCell className="text-center">{player.timeOnIce}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        player.plusMinus.startsWith("+")
                          ? "text-green-600"
                          : player.plusMinus.startsWith("-")
                            ? "text-red-600"
                            : "text-gray-600"
                      }
                    >
                      {player.plusMinus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
