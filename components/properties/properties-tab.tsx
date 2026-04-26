"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    MarketplaceListingCard,
    type MarketplaceListing,
} from "@/components/properties/marketplace-listing-card"
import { SortAndView } from "@/components/properties/sort-and-view"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search } from "lucide-react"
import { PropertyType } from "@prisma/client"
import { BuyTokensModal } from "@/components/property-details/buy-tokens-modal"
import { resolvePropertyTokenSupply } from "@/lib/property-tokens"

const PRICE_MAX = 5_000_000

const TYPE_OPTIONS: { value: "all" | PropertyType; label: string }[] = [
    { value: "all", label: "All types" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "MIXED_USE", label: "Mixed use" },
    { value: "INDUSTRIAL", label: "Industrial" },
    { value: "LAND", label: "Land" },
]

export function PropertiesTab() {
    const { toast } = useToast()
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [minPrice, setMinPrice] = useState(0)
    const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
    const [status, setStatus] = useState<"all" | "active" | "sold">("all")
    const [type, setType] = useState<"all" | PropertyType>("all")
    const [sort, setSort] = useState("recent")
    const [view, setView] = useState<"grid" | "list">("grid")
    const [perPage, setPerPage] = useState(6)
    const [page, setPage] = useState(1)
    const [listings, setListings] = useState<MarketplaceListing[]>([])
    const [loading, setLoading] = useState(true)
    const [meId, setMeId] = useState<string | null | undefined>(undefined)
    const [buyOpen, setBuyOpen] = useState(false)
    const [buyListing, setBuyListing] = useState<MarketplaceListing | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(t)
    }, [search])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const res = await fetch("/api/auth/me", { credentials: "include" })
            if (cancelled) return
            if (res.ok) {
                const j = await res.json()
                setMeId(j.data?.user?.id ?? null)
            } else {
                setMeId(null)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const isLoggedIn = meId != null

    const queryUrl = useMemo(() => {
        const p = new URLSearchParams()
        if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim())
        p.set("minPrice", String(minPrice))
        p.set("maxPrice", String(maxPrice))
        if (status !== "all") p.set("status", status)
        if (type !== "all") p.set("type", type)
        return `/api/listings/marketplace?${p.toString()}`
    }, [debouncedSearch, minPrice, maxPrice, status, type])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(queryUrl, { credentials: "include" })
            if (!res.ok) {
                toast({ title: "Error", description: "Could not load marketplace.", variant: "destructive" })
                return
            }
            const json = await res.json()
            if (json.success) setListings(json.data)
        } catch {
            toast({ title: "Error", description: "Could not load marketplace.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [queryUrl, toast])

    useEffect(() => {
        void load()
    }, [load])

    const sorted = useMemo(() => {
        const arr = [...listings]
        switch (sort) {
            case "price-asc":
                arr.sort((a, b) => a.totalValue - b.totalValue)
                break
            case "price-desc":
                arr.sort((a, b) => b.totalValue - a.totalValue)
                break
            case "roi-desc":
                break
            case "popular":
                arr.sort((a, b) => b.bookmarkCount - a.bookmarkCount)
                break
            default:
                arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
        }
        return arr
    }, [listings, sort])

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
    const start = (page - 1) * perPage
    const items = sorted.slice(start, start + perPage)

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, minPrice, maxPrice, status, type, perPage])

    const onInvest = (listing: MarketplaceListing) => {
        if (!isLoggedIn) {
            toast({ title: "Sign in required", description: "Please log in to buy tokens." })
            return
        }
        setBuyListing(listing)
        setBuyOpen(true)
    }

    if (meId === undefined) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Search borough or address</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as "all" | "active" | "sold")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Available</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Property type</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as "all" | PropertyType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSearch("")
                                setMinPrice(0)
                                setMaxPrice(PRICE_MAX)
                                setStatus("all")
                                setType("all")
                            }}
                        >
                            Reset filters
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Total listing value (USD)</Label>
                    <Slider
                        value={[minPrice, maxPrice]}
                        onValueChange={(v) => {
                            setMinPrice(v[0])
                            setMaxPrice(v[1])
                        }}
                        min={0}
                        max={PRICE_MAX}
                        step={10_000}
                    />
                    <div className="text-xs text-muted-foreground">
                        ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}
                    </div>
                </div>
            </Card>

            <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm text-muted-foreground">
                    {loading ? "Loading…" : `${sorted.length} results`}
                </div>
                <SortAndView sort={sort} setSort={setSort} view={view} setView={setView} perPage={perPage} setPerPage={setPerPage} />
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : view === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Property grid">
                    {items.map((l) => (
                        <MarketplaceListingCard
                            key={l.id}
                            listing={l}
                            isLoggedIn={isLoggedIn}
                            onInvest={onInvest}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3" aria-label="Property list">
                    {items.map((l) => (
                        <MarketplaceListingCard
                            key={l.id}
                            listing={l}
                            isLoggedIn={isLoggedIn}
                            onInvest={onInvest}
                        />
                    ))}
                </div>
            )}

            {!loading && items.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-12">No listings match your filters.</p>
            )}

            {buyListing && (
                <BuyTokensModal
                    open={buyOpen}
                    onOpenChange={(o) => {
                        setBuyOpen(o)
                        if (!o) setBuyListing(null)
                    }}
                    listingId={buyListing.id}
                    propertyTitle={buyListing.property.propertyAddress}
                    referenceId={buyListing.property.referenceId}
                    pricePerTokenUsd={buyListing.pricePerToken}
                    tokensMax={buyListing.tokensRemaining}
                    totalFractions={resolvePropertyTokenSupply(buyListing.property.tokenSupply)}
                />
            )}

            {sorted.length > perPage && !loading && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
