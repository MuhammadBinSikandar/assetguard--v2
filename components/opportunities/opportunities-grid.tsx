"use client"
import { OpportunityCard } from "./opportunity-card"
import type { Opportunity } from "./data"

export function OpportunitiesGrid({ items }: { items: Opportunity[] }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No opportunities match your filters. Try widening your budget or lowering ROI threshold.
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <OpportunityCard key={item.id} item={item} />
      ))}
    </div>
  )
}
