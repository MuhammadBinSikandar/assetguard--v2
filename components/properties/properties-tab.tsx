"use client"

import { useMemo, useState } from "react"
import { FilterSidebar } from "@/components/properties/filter-sidebar"
import { SortAndView } from "@/components/properties/sort-and-view"
import { PropertyCard } from "@/components/properties/property-card"
import { PropertyListItem } from "@/components/properties/property-list-item"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

type Property = {
    id: string
    title: string
    location: string
    price: number
    verified: boolean
    type: "Residential" | "Commercial" | "Land"
    size: string
    roi: number
    progress: number
}

const PROPERTIES: Property[] = [
    {
        id: "p1",
        title: "Marina View Residence",
        location: "Dubai Marina",
        price: 125000,
        verified: true,
        type: "Residential",
        size: "1,200 sqft",
        roi: 6.2,
        progress: 72,
    },
    {
        id: "p2",
        title: "Downtown Offices A",
        location: "Dubai Downtown",
        price: 420000,
        verified: true,
        type: "Commercial",
        size: "9,500 sqft",
        roi: 7.1,
        progress: 45,
    },
    {
        id: "p3",
        title: "Coastal Land Plot",
        location: "Abu Dhabi",
        price: 98000,
        verified: true,
        type: "Land",
        size: "10 acres",
        roi: 5.0,
        progress: 15,
    },
    {
        id: "p4",
        title: "Palm Jumeirah Villa",
        location: "Palm Jumeirah",
        price: 980000,
        verified: true,
        type: "Residential",
        size: "5,800 sqft",
        roi: 4.8,
        progress: 10,
    },
]

export function PropertiesTab() {
    const [filters, setFilters] = useState({
        q: "",
        verifiedOnly: false,
        type: { Residential: true, Commercial: true, Land: true },
        price: [0, 1_000_000] as [number, number],
        tokenization: [0, 100] as [number, number],
        roi: [0, 20] as [number, number],
    })
    const [sort, setSort] = useState("recent")
    const [view, setView] = useState<"grid" | "list">("grid")
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(6)

    const filtered = useMemo(() => {
        return PROPERTIES.filter((p) =>
            filters.q ? (p.title + p.location).toLowerCase().includes(filters.q.toLowerCase()) : true,
        )
            .filter((p) => (filters.verifiedOnly ? p.verified : true))
            .filter((p) => filters.type[p.type])
            .filter((p) => p.price >= filters.price[0] && p.price <= filters.price[1])
            .filter((p) => p.progress >= filters.tokenization[0] && p.progress <= filters.tokenization[1])
            .filter((p) => p.roi >= filters.roi[0] && p.roi <= filters.roi[1])
    }, [filters])

    const sorted = useMemo(() => {
        const arr = [...filtered]
        switch (sort) {
            case "price-asc":
                arr.sort((a, b) => a.price - b.price)
                break
            case "price-desc":
                arr.sort((a, b) => b.price - a.price)
                break
            case "roi-desc":
                arr.sort((a, b) => b.roi - a.roi)
                break
            case "popular":
                arr.sort((a, b) => b.progress - a.progress)
                break
            default:
                // recent - leave order as-is (mock)
                break
        }
        return arr
    }, [filtered, sort])

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
    const start = (page - 1) * perPage
    const items = sorted.slice(start, start + perPage)

    return (
        <div className="space-y-4">
            <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm text-muted-foreground">{sorted.length} results</div>
                <SortAndView
                    sort={sort}
                    setSort={setSort}
                    view={view}
                    setView={setView}
                    perPage={perPage}
                    setPerPage={setPerPage}
                />
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
                <FilterSidebar
                    filters={filters}
                    onChange={setFilters}
                    onReset={() =>
                        setFilters({
                            q: "",
                            verifiedOnly: false,
                            type: { Residential: true, Commercial: true, Land: true },
                            price: [0, 1_000_000],
                            tokenization: [0, 100],
                            roi: [0, 20],
                        })
                    }
                />
                {view === "grid" ? (
                    <div aria-label="Property grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((p) => (
                            <PropertyCard key={p.id} p={p} />
                        ))}
                    </div>
                ) : (
                    <div aria-label="Property list" className="space-y-3">
                        {items.map((p) => (
                            <PropertyListItem key={p.id} p={p} />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing {items.length} of {sorted.length}
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((p) => Math.max(1, p - 1))
                                }}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}
