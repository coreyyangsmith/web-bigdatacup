import type * as React from "react"
import { BarChart3, Eye, Layers, Target, Users, Table, RatIcon as Rink, Settings, Goal, type LucideIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"

// Map every visualization to a unique key so the switches act independently
const visualizationOptions = [
  {
    title: "Heat Maps",
    icon: Target,
    items: [
      { name: "Shot Density", key: "shotDensity" as const },
      { name: "Goal Density", key: "goalDensity" as const },
    ],
  },
  {
    title: "Player Tracking",
    icon: Users,
    items: [
      { name: "Successful Pass", key: "successfulPass" as const },
      { name: "Unsuccessful Pass", key: "unsuccessfulPass" as const },
    ],
  },
  {
    title: "Game Events",
    icon: BarChart3,
    items: [
      { name: "Penalty Location", key: "penaltyLocation" as const },
      { name: "Event Heatmap", key: "eventHeatmap" as const },
    ],
  },
] satisfies Array<{
  title: string
  icon: LucideIcon
  items: Array<{ name: string; key: keyof AppSidebarProps["visualizations"] }>
}>

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedGame: any
  viewMode: "rink" | "table"
  onViewModeChange: (mode: "rink" | "table") => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  showGrid: boolean
  onShowGridChange: (v: boolean) => void
  showZones: boolean
  onShowZonesChange: (v: boolean) => void
  showNumbers: boolean
  onShowNumbersChange: (v: boolean) => void
  visualizations: {
    shotDensity: boolean
    goalDensity: boolean
    successfulPass: boolean
    unsuccessfulPass: boolean
    eventHeatmap: boolean
    penaltyLocation: boolean
  }
  onVisualizationsChange: (v: {
    shotDensity: boolean
    goalDensity: boolean
    successfulPass: boolean
    unsuccessfulPass: boolean
    eventHeatmap: boolean
    penaltyLocation: boolean
  }) => void
  homeColor?: string
  awayColor?: string
  onHomeColorChange?: (c: string) => void
  onAwayColorChange?: (c: string) => void
}

export function AppSidebar({
  selectedGame,
  viewMode,
  onViewModeChange,
  opacity,
  onOpacityChange,
  showGrid,
  onShowGridChange,
  showZones,
  onShowZonesChange,
  showNumbers,
  onShowNumbersChange,
  visualizations,
  onVisualizationsChange,
  homeColor = import.meta.env.VITE_PLAYER_NODE_FILL_HOME ?? "#2563eb",
  awayColor = import.meta.env.VITE_PLAYER_NODE_FILL_AWAY ?? "#dc2626",
  onHomeColorChange = () => {},
  onAwayColorChange = () => {},
  // Settings callbacks reserved
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Hockey Analytics</span>
            <span className="truncate text-xs text-muted-foreground">
              {selectedGame.awayTeam} @ {selectedGame.homeTeam}
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === "rink" ? "default" : "ghost"}
            size="sm"
            className={cn("flex-1 h-8", viewMode === "rink" && "shadow-sm")}
            onClick={() => onViewModeChange("rink")}
          >
            <Goal className="h-4 w-4 mr-1" />
            Rink
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            className={cn("flex-1 h-8", viewMode === "table" && "shadow-sm")}
            onClick={() => onViewModeChange("table")}
          >
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>

        {/* Player Analysis removed from sidebar */}
      </SidebarHeader>
      {viewMode === "rink" && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visualizationOptions.map((category) => (
                  <SidebarMenuItem key={category.title}>
                    <SidebarMenuButton className="font-medium">
                      <category.icon className="h-4 w-4" />
                      <span>{category.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {category.items.map((item) => (
                        <SidebarMenuSubItem key={item.name}>
                          <div className="flex items-center justify-between w-full min-w-0">
                            <Label htmlFor={item.name} className="text-sm font-normal truncate flex-1 mr-2">
                              {item.name}
                            </Label>
                            <Switch
                              id={item.name}
                              checked={visualizations[item.key]}
                              onCheckedChange={(checked) => {
                                onVisualizationsChange({ ...visualizations, [item.key]: checked })
                              }}
                            />
                          </div>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Display Options
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-4 px-2">
                <div className="space-y-2">
                  <Label className="text-sm">Overlay Opacity</Label>
                  <Slider
                    value={[opacity]}
                    onValueChange={(value) => onOpacityChange(value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-right">{opacity}%</div>
                </div>

                <div className="flex items-center justify-between min-w-0">
                  <Label htmlFor="show-grid" className="text-sm truncate flex-1 mr-2">
                    Show Grid
                  </Label>
                  <Switch id="show-grid" checked={showGrid} onCheckedChange={onShowGridChange} />
                </div>

                <div className="flex items-center justify-between min-w-0">
                  <Label htmlFor="show-zones" className="text-sm truncate flex-1 mr-2">
                    Zone Lines
                  </Label>
                  <Switch id="show-zones" checked={showZones} onCheckedChange={onShowZonesChange} />
                </div>

                <div className="flex items-center justify-between min-w-0">
                  <Label htmlFor="show-numbers" className="text-sm truncate flex-1 mr-2">
                    Player Numbers
                  </Label>
                  <Switch id="show-numbers" checked={showNumbers} onCheckedChange={onShowNumbersChange} />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings group */}
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-4 px-2">
                <div className="min-w-0">
                  <Label className="text-sm font-medium block truncate">Home Team Color</Label>
                  <input
                    type="color"
                    value={homeColor}
                    onChange={(e) => onHomeColorChange(e.target.value)}
                    className="w-full h-8 mt-1 rounded min-w-0"
                  />
                </div>
                <div className="min-w-0">
                  <Label className="text-sm font-medium block truncate">Away Team Color</Label>
                  <input
                    type="color"
                    value={awayColor}
                    onChange={(e) => onAwayColorChange(e.target.value)}
                    className="w-full h-8 mt-1 rounded min-w-0"
                  />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>
      )}

      {viewMode === "table" && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Table Filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-goals" className="text-sm">
                    Goals
                  </Label>
                  <Switch id="show-goals" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-assists" className="text-sm">
                    Assists
                  </Label>
                  <Switch id="show-assists" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-shots" className="text-sm">
                    Shots
                  </Label>
                  <Switch id="show-shots" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-hits" className="text-sm">
                    Hits
                  </Label>
                  <Switch id="show-hits" />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}
    </Sidebar>
  )
}
