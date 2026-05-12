"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ShieldCheck, Bookmark, Building2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ROIBadge, ROIBadgeSkeleton, ROIBadgeFallback } from "@/components/ROIBadge"
import type { ROIResult, ROIProjection } from "@/types/roi"
import Link from "next/link"

type P = {
  id: string
  title: string
  location: string
  price: number
  verified: boolean
  type: "Residential" | "Commercial" | "Land"
  size: string
  roi: number
  progress: number
}

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function PropertyCard({ p }: { p: P }) {
  const [roiData, setRoiData] = useState<ROIResult | null>(null)
  const [roiLoading, setRoiLoading] = useState(true)
  const [roiError, setRoiError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchROI() {
      try {
        setRoiLoading(true)
        setRoiError(false)
        const res = await fetch(`/api/roi/${p.id}`, { credentials: "include" })
        if (!res.ok) throw new Error("Failed")
        const data: ROIResult = await res.json()
        if (!cancelled && data.success) {
          setRoiData(data)
        } else if (!cancelled) {
          setRoiError(true)
        }
      } catch {
        if (!cancelled) setRoiError(true)
      } finally {
        if (!cancelled) setRoiLoading(false)
      }
    }
    fetchROI()
    return () => {
      cancelled = true
    }
  }, [p.id])

  const finalProjection: ROIProjection | undefined =
    roiData?.projections?.[roiData.projections.length - 1]

  const isLowROI = finalProjection && finalProjection.roi_percentage < 1

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${isLowROI ? "opacity-60" : ""}`}
    >
      {/* Top badges */}
      <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
        {p.verified && (
          <Badge className="inline-flex items-center gap-1 bg-emerald-600/90 text-white backdrop-blur-sm" variant="secondary">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>
      <button
        aria-label="Bookmark"
        className="absolute right-2 top-2 z-10 rounded-full bg-background/70 p-1.5 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background hover:text-primary"
      >
        <Bookmark className="h-4 w-4" />
      </button>

      {/* Image */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src="/modern-property-exterior.png"
          alt={`Image of ${p.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous"
        />
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{p.title}</h3>
            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {p.location}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold">{fmtUSD.format(p.price)}</div>
          </div>
        </div>

        {/* ROI Badge (fetched) */}
        <div className="flex items-center">
          {roiLoading ? (
            <ROIBadgeSkeleton size="sm" />
          ) : roiError || !roiData || !finalProjection ? (
            <ROIBadgeFallback size="sm" />
          ) : isLowROI ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Low ROI
            </span>
          ) : (
            <ROIBadge
              baselinePrice={roiData.baseline_price}
              finalProjection={finalProjection}
              size="sm"
            />
          )}
        </div>

        {/* Tokenization progress */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tokenization</span>
            <span className="font-medium">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="h-1.5" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Size</div>
            <div className="font-medium">{p.size}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</div>
            <div className="font-medium">{p.type}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. ROI</div>
            <div className="font-medium text-emerald-600 dark:text-emerald-400">+{p.roi}%</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="default" className="w-full sm:w-auto" asChild>
            <Link href={`/properties/${p.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
