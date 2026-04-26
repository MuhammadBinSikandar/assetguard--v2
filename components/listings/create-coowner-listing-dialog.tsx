"use client"

import { useState } from "react"
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
import { Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/** From /api/portfolio/co-owned: resolved USD / token and supply. */
type CoProperty = {
  id: string
  referenceId: string
  borough: string
  block: string
  lot: string
  mintAddress: string | null
  tokenSupply: number
  pricePerToken: number
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export function CreateCoownerListingDialog({
  property,
  maxTokensFromBalance,
  onSuccess,
  children,
}: {
  property: CoProperty
  maxTokensFromBalance: number
  onSuccess?: () => void
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const [quantity, setQuantity] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const qNum = parseInt(quantity, 10)
  const ppt = property.pricePerToken
  const supply = property.tokenSupply
  const validQty =
    Number.isInteger(qNum) && qNum > 0 && qNum <= maxTokensFromBalance && maxTokensFromBalance > 0
  const totalValue = validQty ? qNum * ppt : 0

  const handleCreate = async () => {
    if (!validQty) {
      toast({
        title: "Invalid quantity",
        description: `Enter a whole number from 1 to ${maxTokensFromBalance}.`,
        variant: "destructive",
      })
      return
    }
    if (!property.mintAddress) {
      toast({ title: "Not minted", description: "This property has no token mint on-chain.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, tokensListed: qNum }),
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
      toast({ title: "Listing created", description: "Your token shares are listed on the marketplace." })
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List token shares for sale</DialogTitle>
          <DialogDescription>
            Sell a portion of your co-owned token balance. Your wallet must have delegated the platform to transfer
            tokens, same as the primary market.
          </DialogDescription>
        </DialogHeader>
        {maxTokensFromBalance > 0 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-1 p-3 text-sm">
                <div className="font-mono font-medium">{property.referenceId}</div>
                <div className="text-xs text-muted-foreground">
                  {property.borough} · Block {property.block} · Lot {property.lot}
                </div>
                <div className="inline-flex items-center gap-1 pt-2 text-xs text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Co-investor resale
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  Minted supply: {supply.toLocaleString()} · You can list up to{" "}
                  {maxTokensFromBalance.toLocaleString()} (your balance)
                </p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label htmlFor="co-token-qty">Number of tokens to list</Label>
              <Input
                id="co-token-qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={maxTokensFromBalance}
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max: {maxTokensFromBalance.toLocaleString()} · Price / token: {fmtUSD(ppt)}
              </p>
            </div>
            <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
              <div className="text-muted-foreground">Total listing value (est.)</div>
              <div className="text-lg font-semibold">{fmtUSD(totalValue)}</div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={submitting || !validQty}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List for sale
              </Button>
            </DialogFooter>
          </div>
        )}
        {maxTokensFromBalance < 1 && (
          <p className="text-sm text-muted-foreground">You have no token balance to list.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
