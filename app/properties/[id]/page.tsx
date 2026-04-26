"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/components/ui/use-mobile"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { PropertyBreadcrumbs } from "@/components/property-details/breadcrumbs"
import { PropertyGallery } from "@/components/property-details/gallery"
import { PropertyStickyCard } from "@/components/property-details/sticky-card"
import { PropertyTabs } from "@/components/property-details/tabs"
import { SimilarProperties } from "@/components/property-details/similar-carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { effectivePropertyValuationUsd } from "@/lib/property-valuation"
import { resolvePropertyPricePerToken, resolvePropertyTokenSupply } from "@/lib/property-tokens"
import type { PropertyType } from "@prisma/client"

type PublicListing = {
    id: string
    status: "ACTIVE" | "SOLD"
    tokensListed: number
    tokensRemaining: number
    pricePerToken: number
    totalValue: number
}

type PublicProperty = {
    id: string
    referenceId: string
    borough: string
    block: string
    lot: string
    propertyAddress: string
    ownerName: string
    propertyType: PropertyType
    taxClass: string
    yearBuilt: number | null
    stories: number | null
    totalAreaSqFt: number | null
    commercialUnits: number | null
    residentialUnits: number | null
    frontage: number | null
    depth: number | null
    landAreaSqFt: number | null
    estimatedPriceUSD: number
    verifiedPriceUSD: number | null
    mintAddress: string | null
    tokenSupply: number | null
    pricePerToken: number | null
    tokenSymbol: string
    blockchainNetwork: string
    submittedAt: string
    reviewedAt: string | null
    listing: PublicListing | null
}

const DEFAULT_IMAGES = ["/modern-property-exterior.png", "/interior-property-living-room.jpg"]

function buildDetailModel(p: PublicProperty) {
    const valuation = effectivePropertyValuationUsd(p.estimatedPriceUSD, p.verifiedPriceUSD)
    const supply = resolvePropertyTokenSupply(p.tokenSupply)
    const ppt = resolvePropertyPricePerToken(p.estimatedPriceUSD, p.verifiedPriceUSD, p.pricePerToken)
    const displayPrice = p.listing ? p.listing.totalValue : valuation

    const title = p.propertyAddress
    const location = `${p.borough} · Block ${p.block} · Lot ${p.lot}`

    const typeLabel = p.propertyType.replace(/_/g, " ").toLowerCase()
    const description = `This ${typeLabel} is registered on AssetGuard as ${p.referenceId}. Estimated valuation is ${valuation.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}. Tokens use ${p.tokenSymbol} on ${p.blockchainNetwork}.`

    const features: string[] = [
        `Reference ${p.referenceId}`,
        `BBL: ${p.borough} · Block ${p.block} · Lot ${p.lot}`,
        `Tax class ${p.taxClass}`,
    ]
    if (p.yearBuilt) features.push(`Year built ${p.yearBuilt}`)
    if (p.stories != null) features.push(`${p.stories} stories`)
    if (p.totalAreaSqFt != null)
        features.push(`${p.totalAreaSqFt.toLocaleString()} sq ft (building)`)
    if (p.landAreaSqFt != null) features.push(`${p.landAreaSqFt.toLocaleString()} sq ft (land)`)
    if (p.residentialUnits != null && p.residentialUnits > 0)
        features.push(`${p.residentialUnits} residential units`)
    if (p.commercialUnits != null && p.commercialUnits > 0)
        features.push(`${p.commercialUnits} commercial units`)
    if (p.mintAddress) features.push(`Token mint (devnet): ${p.mintAddress.slice(0, 12)}…`)

    const amenities = [
        `Token symbol: ${p.tokenSymbol}`,
        `Network: ${p.blockchainNetwork}`,
        "Token-2022 standard",
    ]

    const neighborhood = `${p.propertyAddress} — ${p.borough}. Owner of record on file: ${p.ownerName}.`

    const tokenSale = {
        agPricePerFractionUSD: p.listing ? p.listing.pricePerToken : ppt,
        totalFractions: supply,
        availableFractions: p.listing ? p.listing.tokensRemaining : supply,
    }

    const listingOffer = p.listing
        ? {
              listingId: p.listing.id,
              referenceId: p.referenceId,
              status: p.listing.status,
              tokensListed: p.listing.tokensListed,
              tokensRemaining: p.listing.tokensRemaining,
              pricePerToken: p.listing.pricePerToken,
          }
        : null

    return {
        title,
        location,
        price: displayPrice,
        images: DEFAULT_IMAGES,
        description,
        features,
        amenities,
        neighborhood,
        verified: true,
        sticky: {
            id: p.id,
            title,
            location,
            price: displayPrice,
            verified: true,
            roi: 0,
            image: DEFAULT_IMAGES[0],
            listingOffer,
            tokenSale,
        },
    }
}

export default function PropertyDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const isMobile = useIsMobile()
    const [property, setProperty] = useState<PublicProperty | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!id) return
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setNotFound(false)
            try {
                const res = await fetch(`/api/properties/${id}`)
                if (res.status === 404) {
                    if (!cancelled) setNotFound(true)
                    return
                }
                if (!res.ok) {
                    if (!cancelled) setNotFound(true)
                    return
                }
                const json = await res.json()
                if (!json.success || cancelled) return
                setProperty(json.data as PublicProperty)
            } catch {
                if (!cancelled) setNotFound(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    const model = useMemo(() => (property ? buildDetailModel(property) : null), [property])

    if (loading) {
        return (
            <SidebarProvider defaultOpen={!isMobile}>
                <DashboardSidebar />
                <SidebarInset className="min-h-svh">
                    <TopBar />
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    if (notFound || !model) {
        return (
            <SidebarProvider defaultOpen={!isMobile}>
                <DashboardSidebar />
                <SidebarInset className="min-h-svh">
                    <TopBar />
                    <main className="px-4 pb-10 pt-4 md:px-6">
                        <Card>
                            <CardContent className="py-16 text-center text-sm text-muted-foreground">
                                This property is not available or the link is invalid.
                            </CardContent>
                        </Card>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <DashboardSidebar />
            <SidebarInset className="min-h-svh">
                <TopBar />
                <main className="px-4 pb-10 pt-4 md:px-6">
                    <PropertyBreadcrumbs title={model.title} />
                    <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_420px]">
                        <section className="space-y-4">
                            <PropertyGallery images={model.images} title={model.title} />
                            <PropertyTabs
                                propertyId={id as string}
                                property={{
                                    title: model.title,
                                    description: model.description,
                                    features: model.features,
                                    amenities: model.amenities,
                                    neighborhood: model.neighborhood,
                                }}
                            />
                            <SimilarProperties excludePropertyId={property?.id} />
                        </section>

                        <aside className="lg:sticky lg:top-20 lg:h-fit">
                            <PropertyStickyCard property={model.sticky} />
                        </aside>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
