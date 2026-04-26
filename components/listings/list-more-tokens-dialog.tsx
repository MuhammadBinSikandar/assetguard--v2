"use client"

import { useMemo, useState } from "react"
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
import { Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ListMoreTokensDialogProps = {
    listingId: string
    propertyRef: string
    maxAdditionalTokens: number
    onSuccess?: () => void
}

export function ListMoreTokensDialog({
    listingId,
    propertyRef,
    maxAdditionalTokens,
    onSuccess,
}: ListMoreTokensDialogProps) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [quantity, setQuantity] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const parsedQty = useMemo(() => parseInt(quantity, 10), [quantity])
    const validQty =
        Number.isInteger(parsedQty) &&
        parsedQty > 0 &&
        parsedQty <= maxAdditionalTokens &&
        maxAdditionalTokens > 0

    const handleSubmit = async () => {
        if (!validQty) {
            toast({
                title: "Invalid quantity",
                description: `Enter a whole number from 1 to ${maxAdditionalTokens}.`,
                variant: "destructive",
            })
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/listings/${listingId}/add-tokens`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ additionalTokens: parsedQty }),
            })

            const json = await res.json()
            if (!res.ok) {
                toast({
                    title: "Could not add tokens",
                    description: json.message || "Please try again.",
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Listing updated",
                description: "More tokens were added to your active listing.",
            })
            setOpen(false)
            setQuantity("")
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
                <Button variant="outline" size="sm" className="gap-1" disabled={maxAdditionalTokens < 1}>
                    <Plus className="h-3.5 w-3.5" />
                    List More Tokens
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add tokens to listing</DialogTitle>
                    <DialogDescription>
                        Add extra tokens for {propertyRef}. You can add up to {maxAdditionalTokens.toLocaleString()} token(s)
                        based on your current balance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Label htmlFor="add-token-qty">Additional tokens</Label>
                    <Input
                        id="add-token-qty"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={maxAdditionalTokens}
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Maximum additional: {maxAdditionalTokens.toLocaleString()} token(s)
                    </p>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={submitting || !validQty} onClick={() => void handleSubmit()}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Tokens
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
