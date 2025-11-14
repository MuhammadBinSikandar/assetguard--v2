"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter } from "lucide-react"

type Filters = {
  q: string
  verifiedOnly: boolean
  type: Record<"Residential" | "Commercial" | "Land", boolean>
  price: [number, number]
  tokenization: [number, number]
  roi: [number, number]
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)

  const content = (
    <div className="space-y-4 p-2">
      <div>
        <Label>Search</Label>
        <Input
          placeholder="Location or property name"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Price Range</Label>
        <Slider
          value={[filters.price[0], filters.price[1]]}
          onValueChange={(v) => onChange({ ...filters, price: [v[0], v[1]] as [number, number] })}
          max={1_500_000}
          step={10000}
        />
        <div className="text-xs text-muted-foreground">
          ${filters.price[0].toLocaleString()} - ${filters.price[1].toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Property Type</Label>
        {(["Residential", "Commercial", "Land"] as const).map((t) => (
          <div className="flex items-center gap-2" key={t}>
            <Checkbox
              checked={filters.type[t]}
              onCheckedChange={(v) => onChange({ ...filters, type: { ...filters.type, [t]: !!v } })}
              id={`type-${t}`}
            />
            <Label htmlFor={`type-${t}`}>{t}</Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Tokenization Status (%)</Label>
        <Slider
          value={[filters.tokenization[0], filters.tokenization[1]]}
          onValueChange={(v) => onChange({ ...filters, tokenization: [v[0], v[1]] as [number, number] })}
          max={100}
          step={1}
        />
        <div className="text-xs text-muted-foreground">
          {filters.tokenization[0]}% - {filters.tokenization[1]}%
        </div>
      </div>

      <div className="space-y-2">
        <Label>ROI Prediction (%)</Label>
        <Slider
          value={[filters.roi[0], filters.roi[1]]}
          onValueChange={(v) => onChange({ ...filters, roi: [v[0], v[1]] as [number, number] })}
          max={20}
          step={0.1}
        />
        <div className="text-xs text-muted-foreground">
          {filters.roi[0]}% - {filters.roi[1]}%
        </div>
      </div>

      <div className="space-y-4">
      {/* Verified only switch */}
        <div className="flex items-center gap-2">
          <Switch
            id="verified-only"
            checked={filters.verifiedOnly}
            onCheckedChange={(v) => onChange({ ...filters, verifiedOnly: !!v })}
          />
          <Label htmlFor="verified-only">Verified only</Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset} className="flex-1">
            Reset
          </Button>
          <Button variant="secondary" className="flex-1">
            Save search
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <aside className="md:sticky md:top-16">
      {/* Mobile */}
      <div className="mb-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:max-w-sm overflow-y-auto">
            <div className="mt-6">{content}</div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop */}
      <Card className="hidden md:block">{content}</Card>
    </aside>
  )
}
