"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

type RegisteredProperty = {
    id: string
    name: string
    location: string
    ownership: "full" | "fractional"
    fractionalPercent?: number
    purchasePriceSOL: number
    currentValueSOL: number
    purchaseDate: string
    image?: string
    status: "verified" | "pending" | "rejected"
    rejectionReason?: string
}

const REGISTERED_PROPERTIES: RegisteredProperty[] = [
    {
        id: "rp1",
        name: "Marina View Residence",
        location: "Dubai Marina, UAE",
        ownership: "full",
        purchasePriceSOL: 3800,
        currentValueSOL: 4100,
        purchaseDate: "2025-03-15",
        image: "/marina-view-residence.jpg",
        status: "verified",
    },
    {
        id: "rp2",
        name: "Downtown Offices A",
        location: "Dubai Downtown, UAE",
        ownership: "fractional",
        fractionalPercent: 25,
        purchasePriceSOL: 600,
        currentValueSOL: 720,
        purchaseDate: "2025-01-05",
        image: "/downtown-offices-a.jpg",
        status: "verified",
    },
    {
        id: "rp3",
        name: "Palm Jumeirah Villa",
        location: "Palm Jumeirah, UAE",
        ownership: "full",
        purchasePriceSOL: 3000,
        currentValueSOL: 3500,
        purchaseDate: "2024-11-01",
        image: "/palm-jumeirah-villa.jpg",
        status: "verified",
    },
    {
        id: "rp4",
        name: "Business Bay Tower",
        location: "Business Bay, UAE",
        ownership: "fractional",
        fractionalPercent: 5,
        purchasePriceSOL: 250,
        currentValueSOL: 270,
        purchaseDate: "2025-03-01",
        image: "/business-bay-tower.jpg",
        status: "pending",
    },
    {
        id: "rp5",
        name: "Desert Springs Resort",
        location: "Al Ain, UAE",
        ownership: "fractional",
        fractionalPercent: 30,
        purchasePriceSOL: 300,
        currentValueSOL: 330,
        purchaseDate: "2025-01-25",
        image: "/desert-springs-resort.jpg",
        status: "pending",
    },
    {
        id: "rp6",
        name: "Coastal Land Plot",
        location: "Abu Dhabi, UAE",
        ownership: "fractional",
        fractionalPercent: 10,
        purchasePriceSOL: 200,
        currentValueSOL: 180,
        purchaseDate: "2024-12-12",
        image: "/coastal-land-plot.jpg",
        status: "rejected",
        rejectionReason: "Documentation incomplete",
    },
    {
        id: "rp7",
        name: "Old Town Apartment",
        location: "Dubai Old Town, UAE",
        ownership: "fractional",
        fractionalPercent: 15,
        purchasePriceSOL: 400,
        currentValueSOL: 380,
        purchaseDate: "2024-11-20",
        image: "/old-city-lofts-chicago.jpg",
        status: "rejected",
        rejectionReason: "Property verification failed",
    },
]

const SOL_TO_USD = 230
const fmtSOL = (v: number) => `${v.toLocaleString()} SOL`
const fmtUSD = (v: number) => `$${(v * SOL_TO_USD).toLocaleString()}`
const roiPct = (purchase: number, current: number) => {
    const roi = ((current - purchase) / Math.max(1, purchase)) * 100
    return roi >= 0 ? `+${roi.toFixed(1)}%` : `${roi.toFixed(1)}%`
}

export function RegisteredPropertiesTab() {
    const grouped = useMemo(() => {
        return {
            verified: REGISTERED_PROPERTIES.filter((p) => p.status === "verified"),
            pending: REGISTERED_PROPERTIES.filter((p) => p.status === "pending"),
            rejected: REGISTERED_PROPERTIES.filter((p) => p.status === "rejected"),
        }
    }, [])

    const hasAnyProperties = REGISTERED_PROPERTIES.length > 0

    if (!hasAnyProperties) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
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
            {grouped.verified.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h2 className="text-lg font-semibold">Verified</h2>
                        <Badge variant="secondary" className="ml-2">
                            {grouped.verified.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {grouped.verified.map((property) => (
                            <Card key={property.id} className="overflow-hidden">
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    {property.image ? (
                                        <img
                                            src={property.image}
                                            alt={property.name}
                                            className="h-full w-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold leading-tight">{property.name}</h3>
                                            <p className="text-xs text-muted-foreground">{property.location}</p>
                                        </div>
                                        <Badge variant="default" className="shrink-0 bg-green-600">
                                            Verified
                                        </Badge>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <div className="rounded-md bg-accent/50 p-3 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">AG Tokens Issued</p>
                                            <p className="text-2xl font-bold">1,000 AG</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Tokens are now active in your wallet
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {grouped.pending.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-semibold">Pending</h2>
                        <Badge variant="secondary" className="ml-2">
                            {grouped.pending.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {grouped.pending.map((property) => (
                            <Card key={property.id} className="overflow-hidden">
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    {property.image ? (
                                        <img
                                            src={property.image}
                                            alt={property.name}
                                            className="h-full w-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold leading-tight">{property.name}</h3>
                                            <p className="text-xs text-muted-foreground">{property.location}</p>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0 bg-amber-600 text-white">
                                            Pending
                                        </Badge>
                                    </div>
                                    <div className="mt-3 rounded-md bg-amber-50 p-3 text-center">
                                        <p className="text-sm text-amber-800">
                                            Your property is under review. You'll be notified once verification is complete.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {grouped.rejected.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <h2 className="text-lg font-semibold">Rejected</h2>
                        <Badge variant="secondary" className="ml-2">
                            {grouped.rejected.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {grouped.rejected.map((property) => (
                            <Card key={property.id} className="overflow-hidden border-red-200">
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    {property.image ? (
                                        <img
                                            src={property.image}
                                            alt={property.name}
                                            className="h-full w-full object-cover opacity-60"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold leading-tight">{property.name}</h3>
                                            <p className="text-xs text-muted-foreground">{property.location}</p>
                                        </div>
                                        <Badge variant="destructive" className="shrink-0">
                                            Rejected
                                        </Badge>
                                    </div>
                                    {property.rejectionReason && (
                                        <div className="mt-3 rounded-md bg-red-50 p-3">
                                            <p className="text-sm text-red-800">
                                                <span className="font-semibold">Reason:</span> {property.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" className="mt-3 w-full">
                                        Resubmit
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}