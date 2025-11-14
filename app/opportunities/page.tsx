"use client"

import * as React from "react"
import { Hero } from "@/components/opportunities/hero"
import { FilterBar, type FilterState, defaultFilterState } from "@/components/opportunities/filter-bar"
import { OpportunitiesGrid } from "@/components/opportunities/opportunities-grid"
import { allOpportunities } from "@/components/opportunities/data"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { useIsMobile } from "@/components/ui/use-mobile"

export default function OpportunitiesPage() {
  const [filters, setFilters] = React.useState<FilterState>(defaultFilterState)
  const [query, setQuery] = React.useState<string>("")
  const isMobile = useIsMobile()

  // Derived filtered + sorted data
  const filtered = React.useMemo(() => {
    const { budget, minRoiPct, riskLevels, locations, horizon, sortBy } = filters
    const [minBudget, maxBudget] = budget
    let list = allOpportunities.filter((o) => {
      const inBudget = o.price >= minBudget && o.price <= maxBudget
      const meetsRoi = o.predictedRoiPct >= minRoiPct
      const riskOk = riskLevels.length ? riskLevels.includes(o.riskLevel) : true
      const locOk = locations.length ? locations.includes(o.location) : true
      const horizonOk = horizon === "any" ? true : o.horizon === horizon
      const matchesQuery = query
        ? (o.title + " " + o.location + " " + o.why.join(" ")).toLowerCase().includes(query.toLowerCase())
        : true
      return inBudget && meetsRoi && riskOk && locOk && horizonOk && matchesQuery
    })
    list = list.sort((a, b) => {
      if (sortBy === "roi") return b.predictedRoiPct - a.predictedRoiPct
      if (sortBy === "confidence") return b.confidence - a.confidence
      return a.price - b.price // price ascending
    })
    return list
  }, [filters, query])

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="container mx-auto px-4 py-6">
          <Hero onSearch={setQuery} />
          <Separator className="my-6" />
          {/* Removed grid layout and ModelSidebar, made opportunities full width */}
          <div className="space-y-6">
            <FilterBar filters={filters} onChange={setFilters} />
            <OpportunitiesGrid items={filtered} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
