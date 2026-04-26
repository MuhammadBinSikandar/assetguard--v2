"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, MapPin, TrendingUp, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ListingStatus, PropertyType } from "@prisma/client"
import { cn } from "@/lib/utils"

export type MarketplaceListing = {
    id: string
    createdAt: string
    tokensListed: number
    tokensRemaining: number
    pricePerToken: number
    totalValue: number
    status: ListingStatus
    bookmarked: boolean
    bookmarkCount: number
    property: {
        id: string
        referenceId: string
        borough: string
        block: string
        lot: string
        propertyAddress: string
        propertyType: PropertyType
        totalAreaSqFt: number | null
        tokenSupply: number | null
    }
    seller: { id: string; name: string | null }
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function formatPropertyType(t: PropertyType) {
    return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function MarketplaceListingCard({
    listing,
    isLoggedIn,
    onInvest,
}: {
    listing: MarketplaceListing
    isLoggedIn: boolean
    onInvest: (listing: MarketplaceListing) => void
}) {
    const { toast } = useToast()
    const [bm, setBm] = useState(listing.bookmarked)
    const [bmLoading, setBmLoading] = useState(false)
    useEffect(() => {
        setBm(listing.bookmarked)
    }, [listing.id, listing.bookmarked])
    const isActive = listing.status === ListingStatus.ACTIVE
    const isSold = listing.status === ListingStatus.SOLD

    const toggleBookmark = async () => {
        if (!isLoggedIn) {
            toast({ title: "Sign in required", description: "Please log in to bookmark listings." })
            return
        }
        const next = !bm
        setBm(next)
        setBmLoading(true)
        try {
            const res = await fetch(`/api/listings/${listing.id}/bookmark`, {
                method: "POST",
                credentials: "include",
            })
            const json = await res.json()
            if (!res.ok) {
                setBm(!next)
                toast({
                    title: "Bookmark failed",
                    description: json.message || "Please try again.",
                    variant: "destructive",
                })
                return
            }
            setBm(json.bookmarked === true)
        } catch {
            setBm(!next)
            toast({ title: "Bookmark failed", description: "Network error.", variant: "destructive" })
        } finally {
            setBmLoading(false)
        }
    }

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-shadow hover:shadow-md",
                isSold && "opacity-95",
            )}
        >
            <div className="absolute right-2 top-2 z-20">
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/80 shadow-sm"
                    disabled={bmLoading}
                    onClick={() => void toggleBookmark()}
                    aria-label={bm ? "Remove bookmark" : "Bookmark"}
                >
                    {bmLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Heart className={cn("h-4 w-4", bm && "fill-primary text-primary")} />
                    )}
                </Button>
            </div>

            <div className="aspect-[4/3] w-full bg-muted relative">
                {isSold && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-background/20">
                        <Badge variant="secondary" className="text-base px-3 py-1 bg-background/95 border">
                            Sold
                        </Badge>
                    </div>
                )}
                <img
                    src="/modern-property-exterior.png"
                    alt=""
                    className="h-full w-full object-cover"
                />
            </div>

            <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2 pr-8">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-medium">{listing.property.referenceId}</span>
                            {isActive ? (
                                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">Available</Badge>
                            ) : (
                                <Badge variant="secondary" className="text-muted-foreground">
                                    Sold
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 inline-flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {listing.property.borough} · {listing.property.propertyAddress}
                        </p>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Block {listing.property.block} · Lot {listing.property.lot} · {formatPropertyType(listing.property.propertyType)}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">List value</span>
                    <span className="text-lg font-semibold">{fmtUSD(listing.totalValue)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                        <div>{listing.tokensRemaining.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Price / token</div>
                        <div>{fmtUSD(listing.pricePerToken)}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{listing.bookmarkCount} saves</span>
                    {listing.seller.name && <span>Seller: {listing.seller.name}</span>}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button className="w-full gap-2" variant="outline" asChild>
                        <Link href={`/properties/${listing.property.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            View property
                        </Link>
                    </Button>
                    {isActive ? (
                        <Button className="w-full gap-2" type="button" onClick={() => onInvest(listing)}>
                            <TrendingUp className="h-4 w-4" />
                            Invest
                        </Button>
                    ) : (
                        <Button className="w-full" type="button" disabled variant="secondary">
                            Sold
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
