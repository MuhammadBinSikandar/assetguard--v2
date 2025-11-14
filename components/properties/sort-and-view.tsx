"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LayoutGrid, List } from "lucide-react"

export function SortAndView({
  sort,
  setSort,
  view,
  setView,
  perPage,
  setPerPage,
}: {
  sort: string
  setSort: (v: string) => void
  view: "grid" | "list"
  setView: (v: "grid" | "list") => void
  perPage: number
  setPerPage: (n: number) => void
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-start">
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="roi-desc">ROI: High to Low</SelectItem>
          <SelectItem value="recent">Recently Listed</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
        </SelectContent>
      </Select>

      <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Items per page" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="6">6</SelectItem>
          <SelectItem value="9">9</SelectItem>
          <SelectItem value="12">12</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-0 flex w-full items-center gap-1 sm:ml-2 sm:w-auto">
        <Button
          variant={view === "grid" ? "secondary" : "ghost"}
          size="icon"
          aria-label="Grid view"
          onClick={() => setView("grid")}
          className="flex-1 sm:flex-none"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon"
          aria-label="List view"
          onClick={() => setView("list")}
          className="flex-1 sm:flex-none"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
