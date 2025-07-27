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
    expectedGoalDensity: boolean
    successfulPass: boolean
    unsuccessfulPass: boolean
    entryRoutes: boolean
    possessionChain: boolean
    penaltyLocation: boolean
  }
  shotCoordinates?: ShotCoordinate[]
  goalCoordinates?: ShotCoordinate[]
  activeEvents?: GameEvent[]
  playerNumbers?: Record<string, number | null>
  homeColor?: string
  awayColor?: string
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
    expectedGoalDensity: false,
    successfulPass: true,
    unsuccessfulPass: false,
    entryRoutes: false,
    possessionChain: false,
    penaltyLocation: false,
  },
  shotCoordinates = [],
  goalCoordinates = [],
  activeEvents = [],
  playerNumbers = {},
  homeColor,
  awayColor,
}: HockeyRinkProps) {
  // Config via env
  const RADIUS = Number(import.meta.env.VITE_PLAYER_NODE_RADIUS ?? 12)
  const STROKE_W = Number(import.meta.env.VITE_PLAYER_NODE_STROKE_WIDTH ?? 2)
  const STROKE = import.meta.env.VITE_PLAYER_NODE_STROKE_COLOR ?? "#000"
  const FILL_HOME = homeColor ?? (import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb")
  const FILL_AWAY = awayColor ?? (import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626")
  // Standard NHL rink dimensions (scaled)
  const rinkWidth = width * 0.9
  const rinkHeight = height * 0.8
  const cornerRadius = 28
  const centerX = width / 2
  const centerY = height / 2

  // Build player markers from active events
  interface Marker { name: string | null; x: number; y: number; team: string }
  const markers: Marker[] = React.useMemo(() => {
    const res: Marker[] = []
    activeEvents.forEach((ev) => {
      if (ev.x_coordinate != null && ev.y_coordinate != null) {
        res.push({ name: ev.player ?? null, x: ev.x_coordinate, y: ev.y_coordinate, team: ev.team })
      }
      if (ev.x_coordinate_2 != null && ev.y_coordinate_2 != null && ev.player_2) {
        res.push({ name: ev.player_2, x: ev.x_coordinate_2, y: ev.y_coordinate_2, team: ev.team })
      }
    })
    return res
  }, [activeEvents])

  // Helper functions to map rink coordinates from dataset (0-200 x, 0-85 y)
  const mapX = (x: number) => (width - rinkWidth) / 2 + (x / 200) * rinkWidth
  const mapY = (y: number) => (height - rinkHeight) / 2 + (1 - y / 85) * rinkHeight

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Team Names */}
        <div className="absolute bottom-2 left-4 z-10">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium">
            {selectedGame?.homeTeam || "Home Team"}
          </div>
        </div>
        <div className="absolute bottom-2 right-4 z-10">
          <div className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
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
          </defs>
          {/* Ice surface */}
          <rect
            x={(width - rinkWidth) / 2}
            y={(height - rinkHeight) / 2}
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
            x1={centerX}
            y1={(height - rinkHeight) / 2}
            x2={centerX}
            y2={(height + rinkHeight) / 2}
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Center circle */}
          <circle cx={centerX} cy={centerY} r="30" fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Center faceoff dot */}
          <circle cx={centerX} cy={centerY} r="6" fill="#3b82f6" />

          {/* Goal lines */}
          <line
            x1={(width - rinkWidth) / 2 + 89}
            y1={(height - rinkHeight) / 2}
            x2={(width - rinkWidth) / 2 + 89}
            y2={(height + rinkHeight) / 2}
            stroke="#dc2626"
            strokeWidth="2"
          />
          <line
            x1={(width + rinkWidth) / 2 - 89}
            y1={(height - rinkHeight) / 2}
            x2={(width + rinkWidth) / 2 - 89}
            y2={(height + rinkHeight) / 2}
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Goals */}
          <rect
            x={(width - rinkWidth) / 2 + 89 - 24}
            y={centerY - 18}
            width="24"
            height="36"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <rect
            x={(width + rinkWidth) / 2 - 89}
            y={centerY - 18}
            width="24"
            height="36"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Faceoff circles */}
          <circle
            cx={(width - rinkWidth) / 2 + 169}
            cy={centerY - 69}
            r="30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle
            cx={(width - rinkWidth) / 2 + 169}
            cy={centerY + 69}
            r="30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle
            cx={(width + rinkWidth) / 2 - 169}
            cy={centerY - 69}
            r="30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle
            cx={(width + rinkWidth) / 2 - 169}
            cy={centerY + 69}
            r="30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* Faceoff dots */}
          <circle cx={(width - rinkWidth) / 2 + 169} cy={centerY - 69} r="6" fill="#3b82f6" />
          <circle cx={(width - rinkWidth) / 2 + 169} cy={centerY + 69} r="6" fill="#3b82f6" />
          <circle cx={(width + rinkWidth) / 2 - 169} cy={centerY - 69} r="6" fill="#3b82f6" />
          <circle cx={(width + rinkWidth) / 2 - 169} cy={centerY + 69} r="6" fill="#3b82f6" />

          {/* Zone lines (if enabled) */}
          {showZones && (
            <>
              <line
                x1={(width - rinkWidth) / 2 + 200}
                y1={(height - rinkHeight) / 2}
                x2={(width - rinkWidth) / 2 + 200}
                y2={(height + rinkHeight) / 2}
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <line
                x1={(width + rinkWidth) / 2 - 200}
                y1={(height - rinkHeight) / 2}
                x2={(width + rinkWidth) / 2 - 200}
                y2={(height + rinkHeight) / 2}
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
                  x1={(width - rinkWidth) / 2 + (i + 1) * (rinkWidth / 11)}
                  y1={(height - rinkHeight) / 2}
                  x2={(width - rinkWidth) / 2 + (i + 1) * (rinkWidth / 11)}
                  y2={(height + rinkHeight) / 2}
                  stroke="#64748b"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1={(width - rinkWidth) / 2}
                  y1={(height - rinkHeight) / 2 + (i + 1) * (rinkHeight / 7)}
                  x2={(width + rinkWidth) / 2}
                  y2={(height - rinkHeight) / 2 + (i + 1) * (rinkHeight / 7)}
                  stroke="#64748b"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Players Markers based on active events */}
          {markers.map((m, idx) => {
            const jersey = playerNumbers[m.name?.toLowerCase() ?? ""] ?? playerNumbers[m.name ?? ""] ?? ""
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <g>
                    <circle
                      cx={mapX(m.x)}
                      cy={mapY(m.y)}
                      r={RADIUS}
                      fill={m.team === selectedGame?.homeTeam ? FILL_HOME : FILL_AWAY}
                      stroke={STROKE}
                      strokeWidth={STROKE_W}
                    />
                    {showNumbers && jersey && (
                      <text
                        x={mapX(m.x)}
                        y={mapY(m.y) + RADIUS / 3}
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
                <TooltipContent>{m.name ?? "Unknown"}</TooltipContent>
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

            {/* Goal Density Heat Map */}
            {visualizations.goalDensity && (
              <g>
                <circle cx={centerX - 140} cy={centerY - 10} r="25" fill="#10b981" opacity="0.7" />
                <circle cx={centerX + 140} cy={centerY + 5} r="20" fill="#059669" opacity="0.7" />
                <circle cx={centerX - 60} cy={centerY + 30} r="15" fill="#047857" opacity="0.7" />
              </g>
            )}

            {/* Expected Goal Density */}
            {visualizations.expectedGoalDensity && (
              <g>
                <circle cx={centerX - 130} cy={centerY} r="30" fill="#8b5cf6" opacity="0.5" />
                <circle cx={centerX + 135} cy={centerY - 10} r="25" fill="#7c3aed" opacity="0.5" />
                <circle cx={centerX - 45} cy={centerY + 40} r="20" fill="#6d28d9" opacity="0.5" />
              </g>
            )}

            {/* Successful Passes */}
            {visualizations.successfulPass && (
              <g>
                <line
                  x1={centerX - 100}
                  y1={centerY - 30}
                  x2={centerX - 80}
                  y2={centerY + 40}
                  stroke="#10b981"
                  strokeWidth="3"
                  opacity="0.8"
                />
                <line
                  x1={centerX + 100}
                  y1={centerY + 30}
                  x2={centerX + 80}
                  y2={centerY - 40}
                  stroke="#10b981"
                  strokeWidth="3"
                  opacity="0.8"
                />
              </g>
            )}

            {/* Unsuccessful Passes */}
            {visualizations.unsuccessfulPass && (
              <g>
                <line
                  x1={centerX - 150}
                  y1={centerY}
                  x2={centerX - 50}
                  y2={centerY + 60}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
                <line
                  x1={centerX + 150}
                  y1={centerY}
                  x2={centerX + 50}
                  y2={centerY - 60}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
              </g>
            )}

            {/* Entry Routes */}
            {visualizations.entryRoutes && (
              <g>
                <path
                  d={`M ${centerX - 200} ${centerY - 50} Q ${centerX - 100} ${centerY - 80} ${centerX - 50} ${centerY - 20}`}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d={`M ${centerX + 200} ${centerY + 50} Q ${centerX + 100} ${centerY + 80} ${centerX + 50} ${centerY + 20}`}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.8"
                />
              </g>
            )}

            {/* Possession Chain */}
            {visualizations.possessionChain && (
              <g>
                <circle cx={centerX - 120} cy={centerY - 30} r="8" fill="#f59e0b" opacity="0.9" />
                <circle cx={centerX - 80} cy={centerY + 10} r="8" fill="#f59e0b" opacity="0.9" />
                <circle cx={centerX - 40} cy={centerY - 20} r="8" fill="#f59e0b" opacity="0.9" />
                <line
                  x1={centerX - 120}
                  y1={centerY - 30}
                  x2={centerX - 80}
                  y2={centerY + 10}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.9"
                />
                <line
                  x1={centerX - 80}
                  y1={centerY + 10}
                  x2={centerX - 40}
                  y2={centerY - 20}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </g>
            )}

            {/* Penalty Locations */}
            {visualizations.penaltyLocation && (
              <g>
                <circle cx={centerX + 60} cy={centerY - 40} r="12" fill="#ef4444" opacity="0.8" />
                <text
                  x={centerX + 60}
                  y={centerY - 35}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  P
                </text>
                <circle cx={centerX - 90} cy={centerY + 50} r="12" fill="#ef4444" opacity="0.8" />
                <text
                  x={centerX - 90}
                  y={centerY + 55}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  P
                </text>
              </g>
            )}

            {/* Goal Density Heat Map */}
            {visualizations.goalDensity && goalCoordinates.length > 0 && (
              <g>
                {goalCoordinates.map((c, idx) => (
                  <circle key={idx} cx={mapX(c.x)} cy={mapY(c.y)} r={18} fill="url(#goalGradient)" />
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
