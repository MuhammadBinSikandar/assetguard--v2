"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, CheckCircle2, Loader2 } from "lucide-react"

type PropertyItem = {
    id: string
    referenceId: string
    propertyAddress: string
    ownerName: string
    borough: string
    block: string
    lot: string
    propertyType: string
    status: string
    submittedAt: string
    reviewedAt: string | null
    estimatedPriceUSD: number
    walletAddress: string
    adminNotes: string | null
    _count: { documents: number }
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
const fmtUSD = (v: number) => `$${v.toLocaleString()}`

export function TotalPropertiesTab() {
    const [properties, setProperties] = useState<PropertyItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchProperties() {
            try {
                setLoading(true)
                const res = await fetch("/api/properties/my-properties", { credentials: "include" })
                if (!res.ok) {
                    setError("Failed to load properties.")
                    return
                }
                const json = await res.json()
                if (json.success) {
                    setProperties(json.data.filter((p: PropertyItem) => p.status === "APPROVED"))
                }
            } catch {
                setError("Failed to load properties.")
            } finally {
                setLoading(false)
            }
        }
        fetchProperties()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
            </Card>
        )
    }

    // Summary
    const totalValue = properties.reduce((sum, p) => sum + p.estimatedPriceUSD, 0)

    if (properties.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">No approved properties yet</h2>
                        <p className="text-sm text-muted-foreground">
                            Properties will appear here once they are approved by the admin.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/register/property">Register Property</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Summary Stats */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Approved</p>
                        <p className="text-2xl font-bold">{properties.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Portfolio Value</p>
                        <p className="text-2xl font-bold">{fmtUSD(totalValue)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Documents</p>
                        <p className="text-2xl font-bold">{properties.reduce((sum, p) => sum + p._count.documents, 0)}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Property Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold leading-tight truncate">{property.propertyAddress}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {property.borough} · Block {property.block} · Lot {property.lot}
                                    </p>
                                </div>
                                <Badge variant="default" className="shrink-0 bg-green-600">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Approved
                                </Badge>
                            </div>

                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reference</span>
                                    <span className="font-mono text-xs">{property.referenceId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span>{property.ownerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="capitalize">{property.propertyType.replace("_", " ").toLowerCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Est. Value</span>
                                    <span className="font-semibold">{fmtUSD(property.estimatedPriceUSD)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Approved</span>
                                    <span>{property.reviewedAt ? fmtDate(property.reviewedAt) : "—"}</span>
                                </div>
                            </div>

                            <div className="mt-3 rounded-md bg-accent/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">AG Tokens</p>
                                <p className="text-lg font-bold">{property.tokenSymbol ?? "AG"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Tokens active in your wallet</p>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground font-mono truncate" title={property.walletAddress}>
                                {property.walletAddress.slice(0, 4)}...{property.walletAddress.slice(-4)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    )
}