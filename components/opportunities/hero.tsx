"use client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export function Hero({ onSearch }: { onSearch: (q: string) => void }) {
  const lastUpdated = new Date().toLocaleString()
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">AI-Discovered Opportunities</h1>
          <p className="text-muted-foreground">
            Our ML model surfaces high-confidence, tokenizable real-estate opportunities tailored to your risk profile.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          95% prediction accuracy
        </Badge>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">Last updated: {lastUpdated}</div>
        <div className="w-full sm:w-80">
          <label className="sr-only" htmlFor="opp-search">
            Search opportunities
          </label>
          <Input
            id="opp-search"
            placeholder="Search by title, location, reason..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </header>
  )
}
