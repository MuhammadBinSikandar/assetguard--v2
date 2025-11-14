"use client"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Horizon, RiskLevel } from "./data"

export type SortBy = "roi" | "confidence" | "price"

export type FilterState = {
  budget: [number, number]
  minRoiPct: number
  riskLevels: RiskLevel[]
  locations: string[]
  horizon: "any" | Horizon
  sortBy: SortBy
}

export const defaultFilterState: FilterState = {
  budget: [250000, 700000],
  minRoiPct: 8,
  riskLevels: [],
  locations: [],
  horizon: "any",
  sortBy: "roi",
}

const RISK: RiskLevel[] = ["Low", "Medium", "High"]
const LOCATIONS = ["New York, NY", "San Diego, CA", "Austin, TX", "Raleigh, NC", "Seattle, WA"]

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState
  onChange: (s: FilterState) => void
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const toggleChip = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <Label>Budget range</Label>
          <Slider
            value={filters.budget}
            onValueChange={(val) => set({ budget: [val[0], val[1]] as [number, number] })}
            min={200000}
            max={800000}
            step={10000}
          />
          <div className="text-xs text-muted-foreground">
            ${filters.budget[0].toLocaleString()} - ${filters.budget[1].toLocaleString()}
          </div>
        </div>

        <div className="space-y-3">
          <Label>ROI threshold</Label>
          <Slider
            value={[filters.minRoiPct]}
            onValueChange={(val) => set({ minRoiPct: val[0] })}
            min={0}
            max={20}
            step={0.5}
          />
          <div className="text-xs text-muted-foreground">{filters.minRoiPct}%+</div>
        </div>

        <div className="space-y-2">
          <Label>Risk level</Label>
          <div className="flex flex-wrap gap-2">
            {RISK.map((r) => (
              <Button
                key={r}
                type="button"
                variant={filters.riskLevels.includes(r) ? "default" : "outline"}
                className="h-8"
                onClick={() => set({ riskLevels: toggleChip(filters.riskLevels, r) as RiskLevel[] })}
                aria-pressed={filters.riskLevels.includes(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <Button
                key={loc}
                type="button"
                variant={filters.locations.includes(loc) ? "default" : "outline"}
                className="h-8"
                onClick={() => set({ locations: toggleChip(filters.locations, loc) })}
                aria-pressed={filters.locations.includes(loc)}
              >
                {loc}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time horizon</Label>
          <div className="flex gap-2">
            {(["any", "short", "long"] as const).map((h) => (
              <Button
                key={h}
                variant={filters.horizon === h ? "default" : "outline"}
                className="h-8 capitalize"
                onClick={() => set({ horizon: h })}
                aria-pressed={filters.horizon === h}
              >
                {h === "any" ? "Any" : h === "short" ? "Short-term" : "Long-term"}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sort by</Label>
          <Select value={filters.sortBy} onValueChange={(v) => set({ sortBy: v as any })}>
            <SelectTrigger aria-label="Sort opportunities">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">ROI</SelectItem>
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-4" />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => onChange(defaultFilterState)}>
          Reset
        </Button>
        <div className="text-xs text-muted-foreground">Adjust filters to refine AI recommendations.</div>
      </div>
    </div>
  )
}
