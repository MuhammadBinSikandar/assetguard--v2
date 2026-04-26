"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Heart, ExternalLink, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { AuthorizeCustodyButton } from "@/components/listings/authorize-custody-button"
import { ListMoreTokensDialog } from "@/components/listings/list-more-tokens-dialog"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ListingStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

export type MyListingCard = {
    id: string
    tokensListed: number
    tokensRemaining: number
    pricePerToken: number
    totalValue: number
    status: ListingStatus
    bookmarked: boolean
    maxAdditionalTokens?: number
    /** Server: whether delegate or admin-escrow can cover a full remaining sale. */
    custodyReady?: boolean
    property: {
        referenceId: string
        borough: string
        block: string
        lot: string
        mintAddress: string | null
    }
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

const explorerTokenUrl = (mint: string) =>
    `https://explorer.solana.com/address/${encodeURIComponent(mint)}?cluster=devnet`

export function ListingCard({
    listing,
    onDelete,
    onBookmarkChange,
    onCustodyCompleted,
    onListMoreCompleted,
}: {
    listing: MyListingCard
    onDelete: (id: string) => void
    onBookmarkChange: (id: string, bookmarked: boolean) => void
    onCustodyCompleted?: () => void
    onListMoreCompleted?: () => void
}) {
    const { toast } = useToast()
    const [bm, setBm] = useState(listing.bookmarked)
    const [bmLoading, setBmLoading] = useState(false)
    useEffect(() => {
        setBm(listing.bookmarked)
    }, [listing.id, listing.bookmarked])
    const active = listing.status === ListingStatus.ACTIVE
    const showCustodyCta =
        active &&
        listing.custodyReady === false &&
        listing.tokensRemaining > 0 &&
        listing.property.mintAddress

    const toggleBookmark = async () => {
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
            const final = json.bookmarked === true
            setBm(final)
            onBookmarkChange(listing.id, final)
        } catch {
            setBm(!next)
            toast({ title: "Bookmark failed", description: "Network error.", variant: "destructive" })
        } finally {
            setBmLoading(false)
        }
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="font-mono text-sm font-medium">{listing.property.referenceId}</div>
                        <p className="text-xs text-muted-foreground">
                            {listing.property.borough} · Block {listing.property.block} · Lot {listing.property.lot}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={bmLoading}
                            onClick={() => void toggleBookmark()}
                            aria-pressed={bm}
                            aria-label={bm ? "Remove bookmark" : "Bookmark"}
                        >
                            {bmLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Heart
                                    className={cn("h-4 w-4", bm && "fill-primary text-primary")}
                                />
                            )}
                        </Button>
                        {active ? (
                            <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">ACTIVE</Badge>
                        ) : (
                            <Badge variant="secondary" className="text-muted-foreground">
                                SOLD
                            </Badge>
                        )}
                    </div>
                </div>

                {showCustodyCta && (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-950 dark:text-amber-100 dark:border-amber-900/60">
                        <AlertTriangle className="h-4 w-4 shrink-0 opacity-80" />
                        <span>
                            <span className="font-medium">Sales are paused</span> until you authorize the platform
                            to move your remaining tokens, or the platform holds them in custody.
                        </span>
                    </div>
                )}

                <div className="grid gap-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tokens listed</span>
                        <span>{listing.tokensListed.toLocaleString()}</span>
                    </div>
                    {active && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining</span>
                            <span>{listing.tokensRemaining.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Price / token</span>
                        <span>{fmtUSD(listing.pricePerToken)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Total value</span>
                        <span>{fmtUSD(listing.totalValue)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t p-3 bg-muted/30">
                {showCustodyCta && listing.property.mintAddress && (
                    <AuthorizeCustodyButton
                        mintAddress={listing.property.mintAddress}
                        wholeTokens={listing.tokensRemaining}
                        onSuccess={() => onCustodyCompleted?.()}
                        size="sm"
                    />
                )}
                {listing.property.mintAddress && (
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                        <a
                            href={explorerTokenUrl(listing.property.mintAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Mint
                        </a>
                    </Button>
                )}
                {active && (
                    <ListMoreTokensDialog
                        listingId={listing.id}
                        propertyRef={listing.property.referenceId}
                        maxAdditionalTokens={Math.max(0, listing.maxAdditionalTokens ?? 0)}
                        onSuccess={onListMoreCompleted}
                    />
                )}
                {active && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive gap-1"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete listing</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Remove this listing from the marketplace? This does not un-mint your tokens.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => onDelete(listing.id)}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardFooter>
        </Card>
    )
}
