"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/components/ui/use-mobile"
import { AIDiscoveries } from "@/components/AIDiscoveries"
import { ROIBadge, ROIBadgeSkeleton, ROIBadgeFallback } from "@/components/ROIBadge"
import type { BoroughStat } from "@/types/roi"
import type { ROIResult, ROIProjection } from "@/types/roi"
import Link from "next/link"
import {
  Sparkles,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

/* ─────────────────────── Types ─────────────────────── */

interface PropertyListing {
  id: string
  propertyAddress: string
  borough: string
  block: string
  lot: string
  propertyType: string
  estimatedPriceUSD: number
  verifiedPriceUSD: number | null
  totalAreaSqFt: number | null
  residentialUnits: number | null
  commercialUnits: number | null
  yearBuilt: number | null
}

type SortBy = "roi" | "newest" | "price"

const BOROUGHS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})



/* ───────────────── Main Page ───────────────────────── */

export default function OpportunitiesPage() {
  const isMobile = useIsMobile()

  // Property listings
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [propsLoading, setPropsLoading] = useState(true)

  // Fetch all approved properties
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/opportunities/listings")
        if (res.ok) {
          const data = await res.json()
          setProperties(data.data ?? [])
        }
      } catch { /* silent */ }
      finally { setPropsLoading(false) }
    }
    load()
  }, [])



  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="container mx-auto px-4 py-6 space-y-8">

          {/* ── Hero ── */}
          <header className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Investment Opportunities</h1>
                <p className="text-sm text-muted-foreground">
                  ML-powered ROI projections for tokenized NYC real estate
                </p>
              </div>
            </div>
          </header>

          {/* ── Section A: Top AI Discoveries ── */}
          <section>
            <AIDiscoveries registeredProperties={properties as any} />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
