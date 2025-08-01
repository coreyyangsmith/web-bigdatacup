import * as React from "react"
import { HockeyRink } from "./hockey-rink"

interface PannableHockeyRinkProps {
  width?: number
  height?: number
  showGrid?: boolean
  showZones?: boolean
  currentTime?: number
  opacity?: number
  selectedGame?: any
  showNumbers?: boolean
  visualizations?: {
    shotDensity: boolean
    goalDensity: boolean
    successfulPass: boolean
    unsuccessfulPass: boolean
    eventHeatmap: boolean
    penaltyLocation: boolean
  }
  shotCoordinates?: { x: number; y: number }[]
  goalCoordinates?: { x: number; y: number }[]
  activeEvents?: import("@/api/games").Event[]
  events?: import("@/api/games").Event[]
  playerNumbers?: Record<string, number | null>
  homeColor?: string
  awayColor?: string
  eventColors?: Record<string, string>
  selectedTeam?: string
  selectedPlayer?: string
}

export const PannableHockeyRink = React.forwardRef<() => void, PannableHockeyRinkProps>(
  ({ width = 1000, height = 500, shotCoordinates = [], goalCoordinates = [], activeEvents = [], events = [], playerNumbers = {}, homeColor, awayColor, selectedTeam, selectedPlayer, ...rinkProps }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width, height })
    const [transform, setTransform] = React.useState({ x: 0, y: 0, scale: 1 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [lastTransform, setLastTransform] = React.useState({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setLastTransform({ x: transform.x, y: transform.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      setTransform({
        ...transform,
        x: lastTransform.x + deltaX,
        y: lastTransform.y + deltaY,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // Wheel handler is registered with passive: false via useEffect below.
    

    const resetView = () => {
      setTransform({ x: 0, y: 0, scale: 1 })
    }

    // Expose resetView to parent
    React.useImperativeHandle(ref, () => resetView, [resetView])

    React.useEffect(() => {
      // Drag handlers across the document
      const handleGlobalMouseUp = () => setIsDragging(false)
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setTransform((prev) => ({
          ...prev,
          x: lastTransform.x + deltaX,
          y: lastTransform.y + deltaY,
        }))
      }

      if (isDragging) {
        document.addEventListener("mousemove", handleGlobalMouseMove)
        document.addEventListener("mouseup", handleGlobalMouseUp)
      }

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }, [isDragging, dragStart, lastTransform])

    // Wheel zoom handler (non-passive to allow preventDefault)
    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const wheelHandler = (e: WheelEvent) => {
        e.preventDefault()
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        setTransform((prev) => {
          const delta = e.deltaY > 0 ? 0.9 : 1.1
          const newScale = Math.max(0.5, Math.min(3, prev.scale * delta))
          const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale)
          const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale)
          return { x: newX, y: newY, scale: newScale }
        })
      }

      // Attach non-passive wheel listener so we can call preventDefault
      container.addEventListener("wheel", wheelHandler, { passive: false })

      return () => {
        container.removeEventListener("wheel", wheelHandler)
      }
    }, [])

    // Resize observer to fill available space
    React.useEffect(() => {
      if (!containerRef.current) return

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          const { width: w, height: h } = entry.contentRect
          setContainerSize({ width: w, height: h })
        }
      })

      observer.observe(containerRef.current)

      // Initial size
      const { width: w, height: h } = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: w, height: h })

      return () => observer.disconnect()
    }, [])

    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-50 rounded-lg border">
        {/* Instructions */}
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Drag to pan • Scroll to zoom • Scale: {Math.round(transform.scale * 100)}%
        </div>

        {/* Reset button */}
        <button
          onClick={resetView}
          className="absolute top-2 right-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black/80"
        >
          Reset View
        </button>

        <div
          ref={containerRef}
          className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ touchAction: "none" }}
        >
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/*
             Preserve the rink's intrinsic dimensions so it never resizes with the
             parent container.  Users can still pan/zoom to explore the full
             surface without the SVG itself scaling up or down.
            */}
            <HockeyRink
              width={width}
              height={height}
              shotCoordinates={shotCoordinates}
              goalCoordinates={goalCoordinates}
              activeEvents={activeEvents}
              events={events}
              playerNumbers={playerNumbers}
              homeColor={homeColor}
              awayColor={awayColor}
              eventColors={rinkProps.eventColors}
              selectedTeam={selectedTeam}
              selectedPlayer={selectedPlayer}
              {...rinkProps}
            />
          </div>
        </div>
      </div>
    )
  }
)

PannableHockeyRink.displayName = "PannableHockeyRink"
