"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Loader2, ArrowRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

type RecentTx = {
  id: string
  type: "Bought" | "Sold"
  createdAt: string
  propertyReferenceId: string
  tokens: number
  totalSolPaid: number
  status: string
}

type Summary = {
  totalPortfolioValueUsd: number
  totalInvestments: number
  propertiesOwned: number
  recent: RecentTx[]
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function statusBadge(s: string) {
  const m: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
    ESCROW_RECEIVED: { label: "Escrow", className: "bg-sky-500/15 text-sky-800 dark:text-sky-200" },
    COMPLETED: { label: "Done", className: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200" },
    FAILED: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  }
  const d = m[s] ?? { label: s, className: "bg-muted" }
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-normal", d.className)}>
      {d.label}
    </Badge>
  )
}

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [balanceSol, setBalanceSol] = useState<number | null>(null)
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const r = await fetch("/api/dashboard/summary", { credentials: "include" })
      const j = await r.json()
      if (!r.ok || !j.success) {
        setLoadError(j.message || "Could not load dashboard data.")
        return
      }
      setSummary(j.data as Summary)
    } catch {
      setLoadError("Network error while loading the dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/sol-price")
      const j = await r.json()
      if (j.success && typeof j.priceUsd === "number") setSolPriceUsd(j.priceUsd)
    })()
  }, [])

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalanceSol(null)
      return
    }
    let cancel = false
    setBalanceLoading(true)
    void (async () => {
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed")
        if (!cancel) setBalanceSol(lamports / Number(LAMPORTS_PER_SOL))
      } catch {
        if (!cancel) setBalanceSol(null)
      } finally {
        if (!cancel) setBalanceLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [connection, publicKey, connected])

  const balanceUsd = useMemo(() => {
    if (balanceSol == null || solPriceUsd == null) return null
    return balanceSol * solPriceUsd
  }, [balanceSol, solPriceUsd])

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of your portfolio and recent activity</p>
          </div>

          {loadError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </div>
          )}

          <section aria-labelledby="key-metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <h2 id="key-metrics" className="sr-only">
              Key Metrics
            </h2>

            {loading && !summary ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-8 w-24 rounded bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <MetricCard
                  title="Total Portfolio Value"
                  value={summary ? fmtUsd(summary.totalPortfolioValueUsd) : "—"}
                  delta=""
                  hideDelta
                  valueHint="All properties (Owned+Co-owned)"
                />

                <MetricCard
                  title="Total Investments"
                  value={summary ? String(summary.totalInvestments) : "—"}
                  delta=""
                  hideDelta
                  valueHint="completed token purchases (as buyer)"
                />

                <MetricCard
                  title="Properties Owned"
                  value={summary ? String(summary.propertiesOwned) : "—"}
                  delta=""
                  hideDelta
                  valueHint="assets with a positive token balance"
                />

                <MetricCard
                  title="Available Wallet Balance"
                  value={
                    !connected
                      ? "—"
                      : balanceLoading
                        ? "…"
                        : balanceUsd != null
                          ? fmtUsd(balanceUsd)
                          : "—"
                  }
                  delta=""
                  hideDelta
                  valueHint={
                    connected && balanceSol != null
                      ? `${balanceSol.toFixed(4)} SOL`
                      : "connect a wallet in the top bar to show SOL in USD"
                  }
                />
              </>
            )}
          </section>

          <section aria-labelledby="overview" className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <h2 id="overview" className="sr-only">
              Overview
            </h2>
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-pretty">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/transactions" className="gap-1 text-muted-foreground">
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading && !summary ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  </div>
                ) : !summary || summary.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent transactions. Buy tokens on the marketplace or register a property to see activity
                    here.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead className="text-right">SOL</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.recent.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                              {new Date(t.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs">{t.propertyReferenceId}</span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  t.type === "Bought" ? "text-emerald-600" : "text-amber-700 dark:text-amber-400",
                                )}
                              >
                                {t.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">{t.tokens}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">
                              {t.totalSolPaid.toFixed(6)}
                            </TableCell>
                            <TableCell>{statusBadge(t.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-pretty">Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>Discover new investment opportunities tailored to your risk profile.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/opportunities" className="gap-1.5">
                    Browse opportunities
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
