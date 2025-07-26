import type * as React from "react"
import { BarChart3, Eye, Layers, Settings, Target, Users, Table, RatIcon as Rink } from "lucide-react"

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

const visualizationOptions = [
  {
    title: "Heat Maps",
    icon: Target,
    items: [
      { name: "Shot Density", active: false },
      { name: "Goal Density", active: true },
      { name: "Expected Goal Density", active: false },
    ],
  },
  {
    title: "Player Tracking",
    icon: Users,
    items: [
      { name: "Successful Pass", active: true },
      { name: "Unsuccessful Pass", active: false },
      { name: "Entry Routes", active: false },
    ],
  },
  {
    title: "Game Events",
    icon: BarChart3,
    items: [
      { name: "Possession Chain", active: false },
      { name: "Penalty Location", active: false },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedGame: any
  viewMode: "rink" | "table"
  onViewModeChange: (mode: "rink" | "table") => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  onExportData: () => void
  onResetView: () => void
}

export function AppSidebar({
  selectedGame,
  viewMode,
  onViewModeChange,
  opacity,
  onOpacityChange,
  onExportData,
  onResetView,
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
            <Rink className="h-4 w-4 mr-1" />
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

        {/* Player Analysis - Only visible in Rink mode */}
        {viewMode === "rink" && (
          <div className="mt-4">
            <Label className="text-sm font-medium">Player Analysis</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Home Team - {selectedGame.homeTeam}</SelectLabel>
                  <SelectItem value="matthews">A. Matthews (#34)</SelectItem>
                  <SelectItem value="marner">M. Marner (#16)</SelectItem>
                  <SelectItem value="nylander">W. Nylander (#88)</SelectItem>
                  <SelectItem value="tavares">J. Tavares (#91)</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Away Team - {selectedGame.awayTeam}</SelectLabel>
                  <SelectItem value="pastrnak">D. Pastrnak (#88)</SelectItem>
                  <SelectItem value="marchand">B. Marchand (#63)</SelectItem>
                  <SelectItem value="mcavoy">C. McAvoy (#73)</SelectItem>
                  <SelectItem value="bergeron">P. Bergeron (#37)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
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
                    <div className="ml-6 mt-2 space-y-2">
                      {category.items.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <Label htmlFor={item.name} className="text-sm font-normal">
                            {item.name}
                          </Label>
                          <Switch id={item.name} defaultChecked={item.active} size="sm" />
                        </div>
                      ))}
                    </div>
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid" className="text-sm">
                    Show Grid
                  </Label>
                  <Switch id="show-grid" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-zones" className="text-sm">
                    Zone Lines
                  </Label>
                  <Switch id="show-zones" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-numbers" className="text-sm">
                    Player Numbers
                  </Label>
                  <Switch id="show-numbers" defaultChecked />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onExportData}>
                    <Settings className="h-4 w-4" />
                    <span>Export Data</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onResetView}>
                    <Settings className="h-4 w-4" />
                    <span>Reset View</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
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
