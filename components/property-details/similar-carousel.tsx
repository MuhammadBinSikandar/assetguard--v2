"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "@/components/properties/property-card"
import type { PropertyType } from "@prisma/client"
import type { MarketplaceListing } from "@/components/properties/marketplace-listing-card"

function mapCardType(t: PropertyType): "Residential" | "Commercial" | "Land" {
  if (t === "LAND") return "Land"
  if (t === "COMMERCIAL" || t === "INDUSTRIAL") return "Commercial"
  return "Residential"
}

export function SimilarProperties({ excludePropertyId }: { excludePropertyId?: string }) {
  const [items, setItems] = useState<
    {
      id: string
      title: string
      location: string
      price: number
      verified: boolean
      type: "Residential" | "Commercial" | "Land"
      size: string
      roi: number
      progress: number
    }[]
  >([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/listings/marketplace", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        if (!json.success || cancelled) return
        const listings = json.data as MarketplaceListing[]
        const mapped = listings
          .filter((l) => l.property.id !== excludePropertyId)
          .slice(0, 4)
          .map((l) => ({
            id: l.property.id,
            title: l.property.referenceId,
            location: `${l.property.borough} · ${l.property.propertyAddress}`,
            price: Math.round(l.totalValue),
            verified: true,
            type: mapCardType(l.property.propertyType),
            size: l.property.totalAreaSqFt
              ? `${Math.round(l.property.totalAreaSqFt).toLocaleString()} sq ft`
              : "—",
            roi: 0,
            progress: l.status === "ACTIVE" ? 85 : 100,
          }))
        if (!cancelled) setItems(mapped)
      } catch {
        /* keep empty */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [excludePropertyId])

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">More listings</h3>
        <a href="/properties" className="text-sm text-primary underline-offset-4 hover:underline">
          View marketplace
        </a>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {items.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  )
}
