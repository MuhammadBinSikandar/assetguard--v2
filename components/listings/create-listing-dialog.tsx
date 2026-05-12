"use client"

import { useCallback, useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { resolvePropertyPricePerToken, resolvePropertyTokenSupply } from "@/lib/property-tokens"

type MyProperty = {
    id: string
    referenceId: string
    borough: string
    block: string
    lot: string
    status: string
    mintAddress: string | null
    tokenSupply: number | null
    pricePerToken: number | null
    estimatedPriceUSD: number
    verifiedPriceUSD: number | null
    listing: { id: string; status: string } | null
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export function CreateListingDialog({
    onSuccess,
    children,
}: {
    onSuccess?: () => void
    children?: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const [step, setStep] = useState<1 | 2>(1)
    const [fetching, setFetching] = useState(false)
    const [properties, setProperties] = useState<MyProperty[]>([])
    const [selected, setSelected] = useState<MyProperty | null>(null)
    const [quantity, setQuantity] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const loadEligible = useCallback(async () => {
        setFetching(true)
        try {
            const res = await fetch("/api/properties/my-properties", { credentials: "include" })
            if (!res.ok) {
                toast({ title: "Error", description: "Could not load your properties.", variant: "destructive" })
                return
            }
            const json = await res.json()
            if (!json.success) return
            const list: MyProperty[] = json.data
            const eligible = list.filter((p) => {
                if (p.status !== "APPROVED" || p.mintAddress == null || p.listing != null) return false
                const price = resolvePropertyPricePerToken(
                    p.estimatedPriceUSD,
                    p.verifiedPriceUSD,
                    p.pricePerToken,
                )
                return price > 0 && resolvePropertyTokenSupply(p.tokenSupply) > 0
            })
            setProperties(eligible)
        } catch {
            toast({ title: "Error", description: "Could not load your properties.", variant: "destructive" })
        } finally {
            setFetching(false)
        }
    }, [toast])

    useEffect(() => {
        if (open) {
            setStep(1)
            setSelected(null)
            setQuantity("")
            void loadEligible()
        }
    }, [open, loadEligible])

    const qNum = parseInt(quantity, 10)
    const maxSupply = selected
        ? resolvePropertyTokenSupply(selected.tokenSupply)
        : 0
    const price = selected
        ? resolvePropertyPricePerToken(
              selected.estimatedPriceUSD,
              selected.verifiedPriceUSD,
              selected.pricePerToken,
          )
        : 0
    const validQty = Number.isInteger(qNum) && qNum > 0 && qNum <= maxSupply && maxSupply > 0
    const totalValue = validQty ? qNum * price : 0

    const handleCreate = async () => {
        if (!selected || !validQty) {
            toast({
                title: "Invalid quantity",
                description: `Enter a whole number of tokens from 1 to ${maxSupply}.`,
                variant: "destructive",
            })
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/listings/create", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: selected.id, tokensListed: qNum }),
            })
            const json = await res.json()
            if (!res.ok) {
                toast({
                    title: "Could not create listing",
                    description: json.message || "Please try again.",
                    variant: "destructive",
                })
                return
            }
            toast({ title: "Listing created", description: "Your property is now on the marketplace." })
            setOpen(false)
            onSuccess?.()
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button className="gap-2" type="button">
                        <Plus className="h-4 w-4" />
                        Create New Listing
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>List property tokens</DialogTitle>
                    <DialogDescription>
                        Choose an approved, minted property and how many tokens to list. You will need to authorize sales from your wallet after listing.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        {fetching ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : properties.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-8">
                                No eligible properties to list. Properties must be approved and minted first.
                            </p>
                        ) : (
                            <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {properties.map((p) => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelected(p)
                                                setStep(2)
                                            }}
                                            className={cn(
                                                "w-full text-left rounded-lg border border-border p-3 transition hover:bg-accent/50",
                                                selected?.id === p.id && "ring-2 ring-primary",
                                            )}
                                        >
                                            <div className="font-mono text-sm font-medium">{p.referenceId}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {p.borough} · Block {p.block} · Lot {p.lot}
                                            </div>
                                            <div className="mt-2 flex justify-between text-sm">
                                                <span className="text-muted-foreground">Token supply</span>
                                                <span>
                                                    {resolvePropertyTokenSupply(p.tokenSupply).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Price / token</span>
                                                <span>
                                                    {fmtUSD(
                                                        resolvePropertyPricePerToken(
                                                            p.estimatedPriceUSD,
                                                            p.verifiedPriceUSD,
                                                            p.pricePerToken,
                                                        ),
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {step === 2 && selected && (
                    <div className="space-y-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1 -ml-2 w-fit"
                            onClick={() => {
                                setStep(1)
                                setQuantity("")
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Card>
                            <CardContent className="p-3 space-y-1 text-sm">
                                <div className="font-mono font-medium">{selected.referenceId}</div>
                                <div className="text-xs text-muted-foreground">
                                    {selected.borough} · Block {selected.block} · Lot {selected.lot}
                                </div>
                                <div className="pt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approved &amp; minted
                                </div>
                            </CardContent>
                        </Card>
                        <div className="space-y-2">
                            <Label htmlFor="token-qty">Number of tokens to list</Label>
                            <Input
                                id="token-qty"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={maxSupply}
                                placeholder="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Maximum: {maxSupply.toLocaleString()} tokens</p>
                        </div>
                        <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                            <div className="text-muted-foreground">Total listing value</div>
                            <div className="text-lg font-semibold">{fmtUSD(totalValue)}</div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 2 && (
                        <>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleCreate()}
                                disabled={submitting || !validQty}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm &amp; list
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
