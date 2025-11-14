"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RefreshCw } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import MetricsCards from "@/components/analytics/metrics-cards"
import AnalyticsCharts from "@/components/analytics/charts"
import ReportsPanel from "@/components/analytics/reports-panel"
import { RealTimeAlerts } from "@/components/analytics/alerts"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Summary = {
  totalProperties: number
  totalValueUSD: number
  registrations24h: number
  transfers24h: number
  roiPct: number
  updatedAt: string
  timeseries: Array<{ date: string; valueUSD: number }>
  distribution: Array<{ name: string; valueUSD: number }>
  notifications: Array<{ id: string; type: "surge" | "drop" | "info"; message: string; ts: string }>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const propertyOptions = [
  { id: "all", name: "All Properties" },
  { id: "AG-001", name: "AG-001 · Marina View Apt" },
  { id: "AG-104", name: "AG-104 · Downtown Office" },
  { id: "AG-220", name: "AG-220 · Lakeside Villa" },
]

const mockByProperty: Record<string, Summary> = {
  "AG-001": {
    totalProperties: 1,
    totalValueUSD: 420_000,
    registrations24h: 0,
    transfers24h: 2,
    roiPct: 5.6,
    updatedAt: new Date().toISOString(),
    timeseries: [
      { date: "2025-09-28", valueUSD: 410_000 },
      { date: "2025-09-29", valueUSD: 412_500 },
      { date: "2025-09-30", valueUSD: 415_000 },
      { date: "2025-10-01", valueUSD: 417_000 },
      { date: "2025-10-02", valueUSD: 419_000 },
      { date: "2025-10-03", valueUSD: 420_000 },
    ],
    distribution: [
      { name: "Equity", valueUSD: 320_000 },
      { name: "Debt", valueUSD: 100_000 },
    ],
    notifications: [
      { id: "n1", type: "surge", message: "AG-001 price increased 1.1% today", ts: new Date().toISOString() },
      { id: "n2", type: "info", message: "Rental payout posted for September", ts: new Date().toISOString() },
    ],
  },
  "AG-104": {
    totalProperties: 1,
    totalValueUSD: 1_250_000,
    registrations24h: 1,
    transfers24h: 0,
    roiPct: 7.8,
    updatedAt: new Date().toISOString(),
    timeseries: [
      { date: "2025-09-28", valueUSD: 1_230_000 },
      { date: "2025-09-29", valueUSD: 1_235_000 },
      { date: "2025-09-30", valueUSD: 1_238_000 },
      { date: "2025-10-01", valueUSD: 1_240_000 },
      { date: "2025-10-02", valueUSD: 1_245_000 },
      { date: "2025-10-03", valueUSD: 1_250_000 },
    ],
    distribution: [
      { name: "Equity", valueUSD: 900_000 },
      { name: "Debt", valueUSD: 350_000 },
    ],
    notifications: [
      { id: "n3", type: "info", message: "AG-104 new tenant signed 12-month lease", ts: new Date().toISOString() },
    ],
  },
  "AG-220": {
    totalProperties: 1,
    totalValueUSD: 680_000,
    registrations24h: 0,
    transfers24h: 1,
    roiPct: 4.3,
    updatedAt: new Date().toISOString(),
    timeseries: [
      { date: "2025-09-28", valueUSD: 670_000 },
      { date: "2025-09-29", valueUSD: 672_000 },
      { date: "2025-09-30", valueUSD: 674_000 },
      { date: "2025-10-01", valueUSD: 675_000 },
      { date: "2025-10-02", valueUSD: 678_000 },
      { date: "2025-10-03", valueUSD: 680_000 },
    ],
    distribution: [
      { name: "Equity", valueUSD: 530_000 },
      { name: "Debt", valueUSD: 150_000 },
    ],
    notifications: [
      { id: "n4", type: "drop", message: "AG-220 saw a 0.2% dip yesterday", ts: new Date().toISOString() },
    ],
  },
}

const defaultSummary: Summary = {
  totalProperties: 3,
  totalValueUSD: 2_350_000,
  registrations24h: 2,
  transfers24h: 3,
  roiPct: 6.1,
  updatedAt: new Date().toISOString(),
  timeseries: [
    { date: "2025-09-28", valueUSD: 2_300_000 },
    { date: "2025-09-29", valueUSD: 2_310_000 },
    { date: "2025-09-30", valueUSD: 2_320_000 },
    { date: "2025-10-01", valueUSD: 2_330_000 },
    { date: "2025-10-02", valueUSD: 2_340_000 },
    { date: "2025-10-03", valueUSD: 2_350_000 },
  ],
  distribution: [
    { name: "AG-001 · Marina View Apt", valueUSD: 420_000 },
    { name: "AG-104 · Downtown Office", valueUSD: 1_250_000 },
    { name: "AG-220 · Lakeside Villa", valueUSD: 680_000 },
  ],
  notifications: [
    { id: "n-all-1", type: "surge", message: "Portfolio value increased 0.4% today", ts: new Date().toISOString() },
    { id: "n-all-2", type: "info", message: "2 transfers settled in the last 24h", ts: new Date().toISOString() },
  ],
}

export default function AnalyticsPage() {
  const isMobile = useIsMobile()
  const { data, isLoading, mutate } = useSWR<Summary>("/api/analytics/summary", fetcher, {
    revalidateOnFocus: false,
  })
  const [propertyId, setPropertyId] = useState<string>("all")

  const effective = useMemo<Summary | undefined>(() => {
    if (propertyId === "all") return data ?? defaultSummary
    return mockByProperty[propertyId]
  }, [data, propertyId])

  const metrics = useMemo(() => {
    if (!effective) return null
    return {
      totalProperties: effective.totalProperties,
      totalValueUSD: effective.totalValueUSD,
      registrations24h: effective.registrations24h,
      transfers24h: effective.transfers24h,
      roiPct: effective.roiPct,
      updatedAt: effective.updatedAt,
    }
  }, [effective])

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-balance">Analytics</h1>
              <p className="text-muted-foreground">Real-time overview of your properties and investments.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="min-w-[220px]" aria-label="Select property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {propertyOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => mutate()} aria-label="Refresh analytics">
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </Button>
            </div>
          </header>

          <section aria-labelledby="summary-metrics">
            <h2 id="summary-metrics" className="sr-only">
              Summary metrics
            </h2>
            <MetricsCards summary={effective ? {
              totalAssetValueUSD: effective.totalValueUSD,
              totalAG: effective.totalProperties * 1000,
              registrations24h: effective.registrations24h,
              transfers24h: effective.transfers24h,
              activeWallets: 142,
              networkStatus: "online" as const,
              change24hPct: 2.3
            } : undefined} />
          </section>

          <Separator />

          <section aria-labelledby="charts-visuals" className="space-y-6">
            <h2 id="charts-visuals" className="sr-only">
              Charts and visual insights
            </h2>
            <AnalyticsCharts series={effective ? {
              valuationUSD: effective.timeseries.map(t => ({ ts: t.date, value: t.valueUSD })),
              registrations: [
                { day: "2025-09-28", count: 2 },
                { day: "2025-09-29", count: 3 },
                { day: "2025-09-30", count: 1 },
                { day: "2025-10-01", count: 4 },
                { day: "2025-10-02", count: 2 },
                { day: "2025-10-03", count: effective.registrations24h }
              ],
              transfers: [
                { day: "2025-09-28", count: 5 },
                { day: "2025-09-29", count: 3 },
                { day: "2025-09-30", count: 7 },
                { day: "2025-10-01", count: 4 },
                { day: "2025-10-02", count: 6 },
                { day: "2025-10-03", count: effective.transfers24h }
              ]
            } : undefined} />
          </section>

          <Separator />

          <section
            aria-labelledby="reports-notifications"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start"
          >
            <h2 id="reports-notifications" className="sr-only">
              Reports and notifications
            </h2>

            <ReportsPanel />

            <RealTimeAlerts />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
