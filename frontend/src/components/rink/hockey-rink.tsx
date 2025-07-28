import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Event as GameEvent } from "@/api/games"
import React from "react"

interface Player {
  id: string
  name: string
  number: number
  position: string
  team: "home" | "away"
  x: number
  y: number
}

interface ShotCoordinate {
  x: number
  y: number
}

interface HockeyRinkProps {
  width?: number
  height?: number
  showGrid?: boolean
  showZones?: boolean
  showNumbers?: boolean
  currentTime?: number
  opacity?: number
  selectedGame?: any
  visualizations?: {
    shotDensity: boolean
    goalDensity: boolean
    successfulPass: boolean
    unsuccessfulPass: boolean
    eventHeatmap: boolean
    penaltyLocation: boolean
  }
  eventColors?: Record<string, string>
  shotCoordinates?: ShotCoordinate[]
  goalCoordinates?: ShotCoordinate[]
  activeEvents?: GameEvent[]
  events?: GameEvent[]
  playerNumbers?: Record<string, number | null>
  homeColor?: string
  awayColor?: string
  selectedTeam?: string
  selectedPlayer?: string
}

export function HockeyRink({
  width = 800,
  height = 400,
  showGrid = true,
  showZones = true,
  currentTime = 0,
  opacity = 75,
  selectedGame,
  showNumbers = true,
  visualizations = {
    shotDensity: false,
    goalDensity: true,
    successfulPass: true,
    unsuccessfulPass: false,
    eventHeatmap: false,
    penaltyLocation: false,
  },
  shotCoordinates = [],
  goalCoordinates = [],
  activeEvents = [],
  events = [],
  playerNumbers = {},
  homeColor,
  awayColor,
  eventColors = {},
  selectedTeam = "all",
  selectedPlayer = "all",
}: HockeyRinkProps) {
  // Config via env
  const RADIUS = Number(import.meta.env.VITE_PLAYER_NODE_RADIUS ?? 12)
  const STROKE_W = Number(import.meta.env.VITE_PLAYER_NODE_STROKE_WIDTH ?? 2)
  const STROKE = import.meta.env.VITE_PLAYER_NODE_STROKE_COLOR ?? "#000000"
  const FILL_HOME = homeColor ?? (import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb")
  const FILL_AWAY = awayColor ?? (import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626")
  // Standard NHL rink dimensions (scaled)
  // Maintain full 200 ft × 85 ft aspect ratio
  // Use 80% of available width to provide comfortable white-space padding
  const rinkWidth = width * 0.75
  const rinkHeight = rinkWidth * (85 / 200)

  // Conversion factors (feet → pixels)
  const ftToPxX = rinkWidth / 200
  const ftToPxY = rinkHeight / 85
  const SCALE = Math.min(ftToPxX, ftToPxY)

  React.useEffect(() => {
    console.log(activeEvents)
  }, [activeEvents])
  // Geometry helpers (in pixels)
  const cornerRadius = 28 * SCALE
  const centerCircleRadius = 15 * SCALE
  const faceoffCircleRadius = 15 * SCALE
  const faceoffDotRadius = 1.5 * SCALE

  const goalDepthPx = 4 * ftToPxX // depth of goal (along x-axis)
  const goalWidthPx = 8 * ftToPxY // opening width (along y-axis)

  // Cached offsets
  const rinkLeft = (width - rinkWidth) / 2
  const rinkTop = (height - rinkHeight) / 2
  const centerX = width / 2
  const centerY = height / 2

  // Build player markers from active events
  interface Marker {
    name: string | null
    x: number
    y: number
    team: string
    event: GameEvent
  }
  const markersByPosition = React.useMemo(() => {
    const allMarkers: Marker[] = []
    activeEvents.forEach((ev) => {
      if (ev.x_coordinate != null && ev.y_coordinate != null) {
        allMarkers.push({ name: ev.player ?? null, x: ev.x_coordinate, y: ev.y_coordinate, team: ev.team, event: ev })
      }
      if (ev.x_coordinate_2 != null && ev.y_coordinate_2 != null && ev.player_2) {
        allMarkers.push({ name: ev.player_2, x: ev.x_coordinate_2, y: ev.y_coordinate_2, team: ev.team, event: ev })
      }
    })

    return allMarkers.reduce(
      (acc, marker) => {
        const key = `${marker.x.toFixed(2)},${marker.y.toFixed(2)}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(marker)
        return acc
      },
      {} as Record<string, Marker[]>,
    )
  }, [activeEvents])

  const normalize = (s: string | null | undefined) => s?.trim().toLowerCase() ?? ""

  const passArrows = React.useMemo(() => {
    return events.filter((ev) => {
      if (
        ev.x_coordinate == null ||
        ev.y_coordinate == null ||
        ev.x_coordinate_2 == null ||
        ev.y_coordinate_2 == null
      )
        return false

      const evType = ev.event?.toLowerCase() ?? ""
      if (evType !== "play" && evType !== "incomplete play") return false

      // Player filter takes precedence
      if (selectedPlayer !== "all") {
        const pNorm = normalize(selectedPlayer)
        if (normalize(ev.player) !== pNorm && normalize(ev.player_2) !== pNorm) return false
      } else if (selectedTeam !== "all") {
        if (normalize(ev.team) !== normalize(selectedTeam)) return false
      }

      return true
    })
  }, [events, selectedPlayer, selectedTeam])

  // Helper functions to map rink coordinates from dataset (0-200 x, 0-85 y)
  const mapX = (x: number) => rinkLeft + (x / 200) * rinkWidth
  const mapY = (y: number) => rinkTop + (1 - y / 85) * rinkHeight

  // Aggregate goal coordinates by (rounded) location to determine frequency for density sizing
  const goalDensityAggregated = React.useMemo(() => {
    const buckets = new Map<string, { x: number; y: number; count: number }>()

    const key = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}` // 0.1ft precision bucket

    goalCoordinates.forEach((c) => {
      const k = key(c.x, c.y)
      const existing = buckets.get(k)
      if (existing) {
        existing.count += 1
      } else {
        buckets.set(k, { x: c.x, y: c.y, count: 1 })
      }
    })

    return Array.from(buckets.values())
  }, [goalCoordinates])

  const maxGoalCount = React.useMemo(() => goalDensityAggregated.reduce((m, b) => Math.max(m, b.count), 1), [goalDensityAggregated])

  // Aggregate all event coordinates (filtered) for event heatmap
  const filteredEventsForHeat = React.useMemo(() => {
    return events.filter((ev) => {
      if (ev.x_coordinate == null || ev.y_coordinate == null) return false
      if (selectedPlayer !== "all") {
        const pNorm = normalize(selectedPlayer)
        if (normalize(ev.player) !== pNorm && normalize(ev.player_2) !== pNorm) return false
      } else if (selectedTeam !== "all") {
        if (normalize(ev.team) !== normalize(selectedTeam)) return false
      }
      return true
    })
  }, [events, selectedPlayer, selectedTeam])

  const eventDensityAggregated = React.useMemo(() => {
    const buckets = new Map<string, { x: number; y: number; count: number }>()
    const key = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`

    filteredEventsForHeat.forEach((ev) => {
      const k = key(ev.x_coordinate as number, ev.y_coordinate as number)
      const existing = buckets.get(k)
      if (existing) {
        existing.count += 1
      } else {
        buckets.set(k, { x: ev.x_coordinate as number, y: ev.y_coordinate as number, count: 1 })
      }
    })

    return Array.from(buckets.values())
  }, [filteredEventsForHeat])

  const maxEventCount = React.useMemo(() => eventDensityAggregated.reduce((m, b) => Math.max(m, b.count), 1), [eventDensityAggregated])

  const penaltyEvents = React.useMemo(() => {
    return events.filter((ev) => {
      const evType = ev.event?.toLowerCase() ?? ""
      if (!evType.includes("penalty")) return false
      if (ev.x_coordinate == null || ev.y_coordinate == null) return false
      if (selectedPlayer !== "all") {
        const pNorm = normalize(selectedPlayer)
        if (normalize(ev.player) !== pNorm && normalize(ev.player_2) !== pNorm) return false
      } else if (selectedTeam !== "all") {
        if (normalize(ev.team) !== normalize(selectedTeam)) return false
      }
      return true
    })
  }, [events, selectedPlayer, selectedTeam])

  return (
    <TooltipProvider>
      <div className="relative border border-border rounded-lg">
        {/* Team Names */}
        <div className="absolute bottom-2 left-2 z-10 border border-border rounded-lg bg-white">
          <div
            className="text-white px-4 py-1 rounded-md text-sm font-medium text-center"
            style={{ backgroundColor: FILL_HOME }}
          >
            {selectedGame?.homeTeam || "Home Team"}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 z-10 border border-border rounded-lg bg-white">
          <div
            className="text-white px-4 py-1 rounded-md text-sm font-medium text-right"
            style={{ backgroundColor: FILL_AWAY }}
          >
            {selectedGame?.awayTeam || "Away Team"}
          </div>
        </div>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="border border-border rounded-lg bg-white"
        >
          <defs>
            <radialGradient id="shotGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="goalGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eventGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6b7280" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Ice surface */}
          <rect
            x={rinkLeft}
            y={rinkTop}
            width={rinkWidth}
            height={rinkHeight}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="#f8fafc"
            stroke="#1e293b"
            strokeWidth="3"
          />

          {/* Center line */}
          <line
            x1={mapX(100)}
            y1={rinkTop + 1.5}
            x2={mapX(100)}
            y2={rinkTop + rinkHeight - 1.5}
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Center circle & dot */}
          <circle
            cx={mapX(100)}
            cy={mapY(42.5)}
            r={centerCircleRadius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle
            cx={mapX(100)}
            cy={mapY(42.5)}
            r={faceoffDotRadius}
            fill="#3b82f6"
          />

          {/* Goal lines */}
          <line
            x1={mapX(11)}
            y1={rinkTop + cornerRadius/5 + 2.5}
            x2={mapX(11)}
            y2={rinkTop + rinkHeight - cornerRadius/5 - 2.5}
            stroke="#dc2626"
            strokeWidth="2"
          />
          <line
            x1={mapX(189)}
            y1={rinkTop + cornerRadius/5 + 2.5}
            x2={mapX(189)}
            y2={rinkTop + rinkHeight - cornerRadius/5 - 2.5}
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Goals */}
          {/* Left Goal */}
          <path
            d={`M ${mapX(11)} ${mapY(42.5 + 6)} 
                A 6 6, 0,1,1, ${mapX(11)} ${mapY(42.5 - 6)}
                `}
            fill="#79d2f6"
            stroke="#dc2626"
            strokeWidth="1.5"
          />            
          <rect
            x={mapX(11)}
            y={mapY(42.5) - goalWidthPx / 2}
            width={goalDepthPx}
            height={goalWidthPx}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <defs>
            <pattern id="goalGridPattern" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="none"/>
              <line x1="0" y1="0" x2="4" y2="4" stroke="#000000" strokeWidth="0.5"/>
              <line x1="4" y1="0" x2="0" y2="4" stroke="#000000" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <path
            d={`M ${mapX(11)} ${mapY(42.5 + 3)} 
                C ${mapX(11)} ${mapY(42.5 + 3)}, ${mapX(6)} ${mapY(44.5)}, ${mapX(9)} ${mapY(42.5)}
                C ${mapX(9)} ${mapY(42.5)}, ${mapX(6)} ${mapY(40.5)}, ${mapX(11)} ${mapY(42.5 - 3)}`}
            fill="url(#goalGridPattern)"
            stroke="#dc2626"
            strokeWidth="1.5"
          />     
          {/* Right Goal */}  

          <path
            d={`M ${mapX(189)} ${mapY(42.5 + 6)} 
                A 6 6,0,1,0, ${mapX(189)} ${mapY(42.5 - 6)}
                `}
            fill="#79d2f6"
            stroke="#dc2626"
            strokeWidth="1.5"
          />            
          <rect
            x={mapX(189) - goalDepthPx}
            y={mapY(42.5) - goalWidthPx / 2}
            width={goalDepthPx}
            height={goalWidthPx}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <defs>
            <pattern id="goalGridPattern" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="none"/>
              <line x1="0" y1="0" x2="4" y2="4" stroke="#000000" strokeWidth="0.5"/>
              <line x1="4" y1="0" x2="0" y2="4" stroke="#000000" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <path
            d={`M ${mapX(189)} ${mapY(42.5 + 3)} 
                C ${mapX(189)} ${mapY(42.5 + 3)}, ${mapX(194)} ${mapY(44.5)}, ${mapX(191)} ${mapY(42.5)}
                C ${mapX(191)} ${mapY(42.5)}, ${mapX(194)} ${mapY(40.5)}, ${mapX(189)} ${mapY(42.5 - 3)}`}
            fill="url(#goalGridPattern)"
            stroke="#dc2626"
            strokeWidth="1.5"
          />           
          {/* Faceoff circles & dots */}
          {[{ x: 43, y: 20.5 }, { x: 43, y: 64.5 }, { x: 157, y: 20.5 }, { x: 157, y: 64.5 }].map(
            (c, idx) => (
              <g key={idx}>
                <circle
                  cx={mapX(c.x)}
                  cy={mapY(c.y)}
                  r={faceoffCircleRadius}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                <circle
                  cx={mapX(c.x)}
                  cy={mapY(c.y)}
                  r={faceoffDotRadius}
                  fill="#dc2626"
                />
              </g>
            )
          )}

          {/* Faceoff circle lines */}
          {[{ x: 43, y: 20.5 }, { x: 43, y: 64.5 }, { x: 157, y: 20.5 }, { x: 157, y: 64.5 }].map(
            (c, idx) => {
              const isLeft = c.x < 100;
              return (
                <g key={`faceoff-lines-${idx}`}>
                  {/* Hash marks on circle */}
                  <line
                    x1={mapX(c.x) + (isLeft ? -3 : 3)}
                    y1={mapY(c.y) + faceoffCircleRadius + 2 * SCALE}
                    x2={mapX(c.x) + (isLeft ? -3 : 3)}
                    y2={mapY(c.y) + faceoffCircleRadius - 0 * SCALE}
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <line
                    x1={mapX(c.x) + (isLeft ? + 3 : -3)}
                    y1={mapY(c.y) + faceoffCircleRadius - 0 * SCALE}
                    x2={mapX(c.x) + (isLeft ? + 3 : -3)}
                    y2={mapY(c.y) + faceoffCircleRadius + 2 * SCALE}
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <line
                    x1={mapX(c.x) + (isLeft ? -3 : 3)}
                    y1={mapY(c.y) - faceoffCircleRadius - 2 * SCALE}
                    x2={mapX(c.x) + (isLeft ? -3 : 3)}
                    y2={mapY(c.y) - faceoffCircleRadius - 0 * SCALE}
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <line
                    x1={mapX(c.x) + (isLeft ? + 3 : -3)}
                    y1={mapY(c.y) - faceoffCircleRadius - 0 * SCALE}
                    x2={mapX(c.x) + (isLeft ? + 3 : -3)}
                    y2={mapY(c.y) - faceoffCircleRadius - 2 * SCALE}
                    stroke="#dc2626"
                    strokeWidth="2"
                  />                                      
                  {/* L-shaped lines outside circle */}
                  <path
                    d={`M ${mapX(c.x) + (isLeft ? + 6 * SCALE : - 6 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? + 2 * SCALE : - 2 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? + 2 * SCALE : - 2 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 4 * SCALE}`}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${mapX(c.x) + (isLeft ? + 6 * SCALE : - 6 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? + 2 * SCALE : - 2 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? + 2 * SCALE : - 2 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 4 * SCALE}`}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${mapX(c.x) + (isLeft ? - 6 * SCALE : + 6 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? - 2 * SCALE : + 2 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? - 2 * SCALE : + 2 * SCALE)} ${mapY(c.y) - faceoffDotRadius - 4 * SCALE}`}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${mapX(c.x) + (isLeft ? - 6 * SCALE : + 6 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? - 2 * SCALE : + 2 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 1 * SCALE}
                        L ${mapX(c.x) + (isLeft ? - 2 * SCALE : + 2 * SCALE)} ${mapY(c.y) + faceoffDotRadius + 4 * SCALE}`}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                  />                                                      
                </g>
              );
            }
          )}

          {/* Neutral Zone Faceoff Circles */}
          {[{ x: 80, y: 20.5 }, { x: 80, y: 64.5 }, { x: 120, y: 20.5 }, { x: 120, y: 64.5 }].map(
            (c, idx) => (
              <g key={idx}>
                <circle
                  cx={mapX(c.x)}
                  cy={mapY(c.y)}
                  r={faceoffDotRadius}
                  fill="#dc2626"
                />
              </g>
            )
          )}          

          {/* Zone lines (blue lines) */}
          {showZones && (
            <>
              <line
                x1={mapX(75)}
                y1={rinkTop + 1.5}
                x2={mapX(75)}
                y2={rinkTop + rinkHeight - 1.5}
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <line
                x1={mapX(125)}
                y1={rinkTop + 1.5}
                x2={mapX(125)}
                y2={rinkTop + rinkHeight - 1.5}
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </>
          )}

          {/* Grid overlay (if enabled) */}
          {showGrid && (
            <g opacity="0.1">
              {Array.from({ length: 10 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={rinkLeft + (i + 1) * (rinkWidth / 11)}
                  y1={rinkTop}
                  x2={rinkLeft + (i + 1) * (rinkWidth / 11)}
                  y2={rinkTop + rinkHeight}
                  stroke="#64748b"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1={rinkLeft}
                  y1={rinkTop + (i + 1) * (rinkHeight / 7)}
                  x2={rinkLeft + rinkWidth}
                  y2={rinkTop + (i + 1) * (rinkHeight / 7)}
                  stroke="#64748b"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Players Markers based on active events */}
          {Object.values(markersByPosition).map((markers, idx) => {
            if (markers.length === 0) return null
            const firstMarker = markers[0]
            const jersey = playerNumbers[firstMarker.name?.toLowerCase() ?? ""] ?? playerNumbers[firstMarker.name ?? ""] ?? ""

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <g>
                    <circle
                      cx={mapX(firstMarker.x)}
                      cy={mapY(firstMarker.y)}
                      r={RADIUS}
                      fill={firstMarker.team === selectedGame?.homeTeam ? FILL_HOME : FILL_AWAY}
                      stroke={STROKE}
                      strokeWidth={STROKE_W}
                    />
                    {showNumbers && jersey && (
                      <text
                        x={mapX(firstMarker.x)}
                        y={mapY(firstMarker.y) + RADIUS / 3}
                        textAnchor="middle"
                        fill="white"
                        fontSize={RADIUS}
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {jersey}
                      </text>
                    )}
                  </g>
                </TooltipTrigger>
                <TooltipContent arrowColor={firstMarker.team === selectedGame?.homeTeam ? (homeColor ?? "#2563eb") : (awayColor ?? "#dc2626")}>
                  <div className="space-y-4 min-w-[220px] bg-zinc-800 p-2 rounded-md">
                    {Array.from(new Set(markers.map((m) => m.name ?? "Unknown"))).map((playerName, idx2) => {
                      const playerEvents = activeEvents.filter(
                        (ev) =>
                          ev.player?.toLowerCase() === playerName.toLowerCase() ||
                          ev.player_2?.toLowerCase() === playerName.toLowerCase(),
                      )

                      return (
                        <div key={idx2}>
                          <p className="font-bold text-white mb-1">{playerName}</p>
                          <ul className="text-xs text-white/90 list-disc list-inside space-y-0.5">
                            {playerEvents.map((ev, eidx) => {
                              const det = [ev.detail_1, ev.detail_2, ev.detail_3, ev.detail_4]
                                .filter(Boolean)
                                .join(", ")
                              return (
                                <li key={eidx} className="capitalize">
                                  {ev.event}
                                  {det && <span className="opacity-80"> – {det}</span>}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
          {/* Visualization Overlays */}
          <g opacity={opacity / 100}>
            {/* Shot Density Heat Map (data-driven) */}
            {visualizations.shotDensity && shotCoordinates.length > 0 && (
              <g>
                {shotCoordinates.map((c, idx) => (
                  <circle
                    key={idx}
                    cx={mapX(c.x)}
                    cy={mapY(c.y)}
                    r={20}
                    fill="url(#shotGradient)"
                  />
                ))}
              </g>
            )}

            {/* Goal Density Heat Map (data-driven) */}
            {visualizations.goalDensity && goalDensityAggregated.length > 0 && (
              <g>
                {goalDensityAggregated.map((c, idx) => {
                  const intensity = c.count / maxGoalCount // 0-1
                  const radius = 12 + intensity * 18 // 12-30 px
                  const opacityVal = 0.4 + intensity * 0.6 // 0.4-1
                  return (
                    <circle
                      key={idx}
                      cx={mapX(c.x)}
                      cy={mapY(c.y)}
                      r={radius}
                      fill="url(#goalGradient)"
                      opacity={opacityVal}
                    />
                  )
                })}
              </g>
            )}

            {/* Successful / Unsuccessful Passes - dynamic arrows */}
            {(visualizations.successfulPass || visualizations.unsuccessfulPass) && passArrows.length > 0 && (
              <g>
                {passArrows.map((ev, idx) => {
                  const evType = ev.event?.toLowerCase() ?? ""
                  const isSuccessful = evType === "play"
                  const isUnsuccessful = evType === "incomplete play"

                  if ((isSuccessful && !visualizations.successfulPass) || (isUnsuccessful && !visualizations.unsuccessfulPass)) {
                    return null
                  }

                  const x1 = mapX(ev.x_coordinate as number)
                  const y1 = mapY(ev.y_coordinate as number)
                  const x2 = mapX(ev.x_coordinate_2 as number)
                  const y2 = mapY(ev.y_coordinate_2 as number)

                  const color = isSuccessful
                    ? eventColors["play"] ?? "#10b981"
                    : eventColors["incomplete play"] ?? "#ef4444"

                  // Arrow head calculation
                  const dx = x2 - x1
                  const dy = y2 - y1
                  const angle = Math.atan2(dy, dx)
                  const size = 6
                  const arrowP1 = { x: x2, y: y2 }
                  const arrowP2 = {
                    x: x2 - size * Math.cos(angle - Math.PI / 6),
                    y: y2 - size * Math.sin(angle - Math.PI / 6),
                  }
                  const arrowP3 = {
                    x: x2 - size * Math.cos(angle + Math.PI / 6),
                    y: y2 - size * Math.sin(angle + Math.PI / 6),
                  }

                  return (
                    <g key={idx} stroke={color} fill={color} strokeWidth={2} opacity={0.9}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} />
                      <polygon points={`${arrowP1.x},${arrowP1.y} ${arrowP2.x},${arrowP2.y} ${arrowP3.x},${arrowP3.y}`} />
                    </g>
                  )
                })}
              </g>
            )}

            {/* Event Heatmap */}
            {visualizations.eventHeatmap && eventDensityAggregated.length > 0 && (
              <g>
                {eventDensityAggregated.map((c, idx) => {
                  const intensity = c.count / maxEventCount
                  const radius = 5 + intensity * 20
                  const opacityVal = 0.3 + intensity * 0.7
                  return (
                    <circle
                      key={idx}
                      cx={mapX(c.x)}
                      cy={mapY(c.y)}
                      r={radius}
                      fill="url(#eventGradient)"
                      opacity={opacityVal}
                    />
                  )
                })}
              </g>
            )}

            {/* Penalty Locations */}
            {visualizations.penaltyLocation && penaltyEvents.length > 0 && (
              <g>
                {penaltyEvents.map((ev, idx) => (
                  <g key={idx}>
                    <circle cx={mapX(ev.x_coordinate as number)} cy={mapY(ev.y_coordinate as number)} r="10" fill="#ef4444" opacity="0.8" />
                    <text
                      x={mapX(ev.x_coordinate as number)}
                      y={mapY(ev.y_coordinate as number) + 3}
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      P
                    </text>
                  </g>
                ))}
              </g>
            )}
          </g>

          {/* Player positions with hover tooltips */}
          {/* This section is now redundant as markers are handled by activeEvents */}
        </svg>
      </div>
    </TooltipProvider>
  )
}
