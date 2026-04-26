"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MarketplaceListingCard, type MarketplaceListing } from "@/components/properties/marketplace-listing-card"
import { SortAndView } from "@/components/properties/sort-and-view"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { BuyTokensModal } from "@/components/property-details/buy-tokens-modal"
import { resolvePropertyTokenSupply } from "@/lib/property-tokens"

export function BookmarkedTab() {
    const { toast } = useToast()
    const [sort, setSort] = useState("recent")
    const [view, setView] = useState<"grid" | "list">("grid")
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(6)
    const [listings, setListings] = useState<MarketplaceListing[]>([])
    const [loading, setLoading] = useState(true)
    const [authed, setAuthed] = useState<boolean | null>(null)
    const [buyOpen, setBuyOpen] = useState(false)
    const [buyListing, setBuyListing] = useState<MarketplaceListing | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/listings/marketplace?bookmarkedOnly=1", { credentials: "include" })
            if (res.status === 401) {
                setAuthed(false)
                setListings([])
                return
            }
            if (!res.ok) {
                toast({ title: "Error", description: "Could not load bookmarks.", variant: "destructive" })
                return
            }
            setAuthed(true)
            const json = await res.json()
            if (json.success) setListings(json.data)
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        void load()
    }, [load])

    const onInvest = (listing: MarketplaceListing) => {
        setBuyListing(listing)
        setBuyOpen(true)
    }

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

    if (loading && authed === null) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (authed === false) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <Bookmark className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Sign in to see bookmarks</h3>
                    <p className="text-center text-sm text-muted-foreground max-w-sm mb-4">
                        Log in to view listings you have saved.
                    </p>
                    <Button asChild>
                        <Link href="/login">Log in</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (listings.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <Bookmark className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">No bookmarked listings</h3>
                    <p className="text-center text-sm text-muted-foreground max-w-sm">
                        Browse the marketplace and use the heart icon to save listings here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm text-muted-foreground">{sorted.length} bookmarked</div>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Bookmarked grid">
                    {items.map((l) => (
                        <MarketplaceListingCard
                            key={l.id}
                            listing={l}
                            isLoggedIn
                            onInvest={onInvest}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3" aria-label="Bookmarked list">
                    {items.map((l) => (
                        <MarketplaceListingCard
                            key={l.id}
                            listing={l}
                            isLoggedIn
                            onInvest={onInvest}
                        />
                    ))}
                </div>
            )}

            {sorted.length > perPage && (
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
        </div>
    )
}
