"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, BadgeCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { effectivePropertyValuationUsd } from "@/lib/property-valuation"

function formatUsd(n: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(n)
}

export function AdminVerifiedPriceEditor({
    propertyId,
    submittedPriceUSD,
    verifiedPriceUSD,
    onSaved,
}: {
    propertyId: string
    submittedPriceUSD: number
    verifiedPriceUSD: number | null
    onSaved: (next: { verifiedPriceUSD: number | null }) => void
}) {
    const { toast } = useToast()
    const [draft, setDraft] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setDraft(verifiedPriceUSD != null ? String(verifiedPriceUSD) : "")
    }, [propertyId, verifiedPriceUSD])

    const effective = effectivePropertyValuationUsd(submittedPriceUSD, verifiedPriceUSD)

    const handleSave = async () => {
        const trimmed = draft.trim()
        let value: number | null
        if (trimmed === "") {
            value = null
        } else {
            const n = Number(trimmed)
            if (!Number.isFinite(n) || n < 0) {
                toast({
                    title: "Invalid price",
                    description: "Enter a valid non-negative number, or leave empty to use the owner’s estimate only.",
                    variant: "destructive",
                })
                return
            }
            value = n
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/admin/properties/${propertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ verifiedPriceUSD: value }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok || !json.success) {
                toast({
                    title: "Could not save",
                    description: typeof json.message === "string" ? json.message : "Update failed.",
                    variant: "destructive",
                })
                return
            }
            const nextVerified = json.data?.verifiedPriceUSD ?? null
            onSaved({ verifiedPriceUSD: nextVerified })
            toast({
                title: "Valuation updated",
                description:
                    nextVerified != null
                        ? `Recorded admin verified price ${formatUsd(nextVerified)}.`
                        : "Cleared admin override; owner estimate is used.",
            })
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Admin verified price
                </CardTitle>
                <p className="text-xs text-muted-foreground font-normal">
                    Overrides the owner-submitted estimate for approvals, minting, and owner portfolio when set.
                    Leave blank and save to clear the override.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-2 text-xs">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Owner submitted</span>
                        <span className="font-medium">{formatUsd(submittedPriceUSD)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Effective (used everywhere)</span>
                        <span className="font-medium text-primary">{formatUsd(effective)}</span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`verified-price-${propertyId}`} className="text-xs">
                        Verified price (USD)
                    </Label>
                    <Input
                        id={`verified-price-${propertyId}`}
                        type="number"
                        min={0}
                        step="1"
                        placeholder="e.g. correct market value"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="text-sm"
                    />
                </div>
                <Button type="button" size="sm" className="w-full gap-2" disabled={saving} onClick={handleSave}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save verified price
                </Button>
            </CardContent>
        </Card>
    )
}
