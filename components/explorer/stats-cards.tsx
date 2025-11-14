"use client"

import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function StatsCards() {
  const { data } = useSWR("/api/explorer/transactions", fetcher)
  const txs = data?.transactions ?? []
  const totals = {
    totalTransactions: txs.length || 1245,
    propertiesTokenized: 48,
    activeWallets: 312,
    networkStatus: "Online",
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Transactions" value={totals.totalTransactions.toLocaleString()} sub="+2.3% 24h" />
      <StatCard label="Total Properties Tokenized" value={totals.propertiesTokenized.toLocaleString()} />
      <StatCard label="Active Wallets" value={totals.activeWallets.toLocaleString()} />
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Network Status</div>
        <div className="mt-1 flex items-center gap-2">
          <span aria-hidden className="inline-block size-2 rounded-full bg-emerald-500" />
          <div className="text-xl font-semibold">{totals.networkStatus}</div>
        </div>
        <div className="mt-2">
          <Button asChild variant="outline" size="sm" aria-label="View on Solscan Devnet">
            <a href="https://solscan.io/?cluster=devnet" target="_blank" rel="noreferrer">
              View on Solscan (Devnet)
            </a>
          </Button>
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  indicator,
}: {
  label: string
  value: string
  sub?: string
  indicator?: "success" | "warning" | "error"
}) {
  const dot =
    indicator === "success"
      ? "bg-emerald-500"
      : indicator === "warning"
        ? "bg-amber-500"
        : indicator === "error"
          ? "bg-red-500"
          : ""
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        {indicator && <span aria-hidden className={`inline-block size-2 rounded-full ${dot}`} />}
        <div className="text-xl font-semibold">{value}</div>
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  )
}
