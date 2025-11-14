"use client"

import { useMemo, useState } from "react"
import { PropertyCard } from "@/components/properties/property-card"
import { PropertyListItem } from "@/components/properties/property-list-item"
import { SortAndView } from "@/components/properties/sort-and-view"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Bookmark } from "lucide-react"

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

// Mock bookmarked properties
const BOOKMARKED_PROPERTIES: Property[] = [
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

export function BookmarkedTab() {
    const [sort, setSort] = useState("recent")
    const [view, setView] = useState<"grid" | "list">("grid")
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(6)

    const sorted = useMemo(() => {
        const arr = [...BOOKMARKED_PROPERTIES]
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
    }, [sort])

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
    const start = (page - 1) * perPage
    const items = sorted.slice(start, start + perPage)

    if (BOOKMARKED_PROPERTIES.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <Bookmark className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">No Bookmarked Properties</h3>
                    <p className="text-center text-sm text-muted-foreground max-w-sm">
                        You haven't bookmarked any properties yet. Browse properties and click the bookmark icon to save them here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm text-muted-foreground">{sorted.length} bookmarked properties</div>
                <SortAndView
                    sort={sort}
                    setSort={setSort}
                    view={view}
                    setView={setView}
                    perPage={perPage}
                    setPerPage={setPerPage}
                />
            </header>

            {view === "grid" ? (
                <div aria-label="Bookmarked properties grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                        <PropertyCard key={p.id} p={p} />
                    ))}
                </div>
            ) : (
                <div aria-label="Bookmarked properties list" className="space-y-3">
                    {items.map((p) => (
                        <PropertyListItem key={p.id} p={p} />
                    ))}
                </div>
            )}

            {sorted.length > perPage && (
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
            )}
        </div>
    )
}
