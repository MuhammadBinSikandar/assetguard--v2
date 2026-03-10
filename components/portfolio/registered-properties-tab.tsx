"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, Clock, XCircle, Loader2, Building2, Search } from "lucide-react"

type PropertyItem = {
    id: string
    referenceId: string
    propertyAddress: string
    ownerName: string
    borough: string
    block: string
    lot: string
    propertyType: string
    status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
    submittedAt: string
    reviewedAt: string | null
    estimatedPriceUSD: number
    walletAddress: string
    adminNotes: string | null
    _count: { documents: number }
}

const STATUS_CONFIG = {
    PENDING: { label: "Pending", icon: Clock, color: "bg-amber-600 text-white", section: "pending" },
    UNDER_REVIEW: { label: "Under Review", icon: Search, color: "bg-blue-600 text-white", section: "underReview" },
    REJECTED: { label: "Rejected", icon: XCircle, color: "", section: "rejected" },
    APPROVED: { label: "Approved", icon: CheckCircle2, color: "bg-green-600 text-white", section: "approved" },
} as const

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
const fmtUSD = (v: number) => `$${v.toLocaleString()}`

export function RegisteredPropertiesTab() {
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
                    // Filter out approved — those go in Total Properties tab
                    setProperties(json.data.filter((p: PropertyItem) => p.status !== "APPROVED"))
                }
            } catch {
                setError("Failed to load properties.")
            } finally {
                setLoading(false)
            }
        }
        fetchProperties()
    }, [])

    const grouped = useMemo(() => ({
        pending: properties.filter((p) => p.status === "PENDING"),
        underReview: properties.filter((p) => p.status === "UNDER_REVIEW"),
        rejected: properties.filter((p) => p.status === "REJECTED"),
    }), [properties])

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

    if (properties.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">No registered properties yet</h2>
                        <p className="text-sm text-muted-foreground">
                            Register your first property to start the verification process.
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
        <div className="space-y-8">
            {grouped.pending.length > 0 && (
                <PropertySection
                    title="Pending"
                    icon={<Clock className="h-5 w-5 text-amber-600" />}
                    count={grouped.pending.length}
                    properties={grouped.pending}
                />
            )}

            {grouped.underReview.length > 0 && (
                <PropertySection
                    title="Under Review"
                    icon={<Search className="h-5 w-5 text-blue-600" />}
                    count={grouped.underReview.length}
                    properties={grouped.underReview}
                />
            )}

            {grouped.rejected.length > 0 && (
                <PropertySection
                    title="Rejected"
                    icon={<XCircle className="h-5 w-5 text-red-600" />}
                    count={grouped.rejected.length}
                    properties={grouped.rejected}
                />
            )}
        </div>
    )
}

function PropertySection({
    title,
    icon,
    count,
    properties,
}: {
    title: string
    icon: React.ReactNode
    count: number
    properties: PropertyItem[]
}) {
    return (
        <section>
            <div className="mb-4 flex items-center gap-2">
                {icon}
                <h2 className="text-lg font-semibold">{title}</h2>
                <Badge variant="secondary" className="ml-2">{count}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </section>
    )
}

function PropertyCard({ property }: { property: PropertyItem }) {
    const config = STATUS_CONFIG[property.status]
    const StatusIcon = config.icon

    return (
        <Card className={`overflow-hidden ${property.status === "REJECTED" ? "border-red-200" : ""}`}>
            <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-semibold leading-tight truncate">{property.propertyAddress}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {property.borough} · Block {property.block} · Lot {property.lot}
                        </p>
                    </div>
                    {property.status === "REJECTED" ? (
                        <Badge variant="destructive" className="shrink-0">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className={`shrink-0 ${config.color}`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                        </Badge>
                    )}
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
                        <span className="text-muted-foreground">Submitted</span>
                        <span>{fmtDate(property.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Documents</span>
                        <span>{property._count.documents}</span>
                    </div>
                </div>

                {property.status === "PENDING" || property.status === "UNDER_REVIEW" ? (
                    <div className="mt-3 rounded-md bg-accent/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Your property is under review. You&apos;ll be notified once verification is complete.
                        </p>
                    </div>
                ) : null}

                {property.status === "REJECTED" && property.adminNotes && (
                    <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 p-3">
                        <p className="text-sm text-red-800 dark:text-red-300">
                            <span className="font-semibold">Reason:</span> {property.adminNotes}
                        </p>
                    </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono truncate max-w-[120px]" title={property.walletAddress}>
                        {property.walletAddress.slice(0, 4)}...{property.walletAddress.slice(-4)}
                    </span>
                    {property.reviewedAt && <span>Reviewed {fmtDate(property.reviewedAt)}</span>}
                </div>
            </CardContent>
        </Card>
    )
}