"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Summary = {
  totalAssetValueUSD: number
  totalAG: number
  registrations24h: number
  transfers24h: number
  activeWallets: number
  networkStatus: "online" | "degraded" | "offline"
  change24hPct: number
}

export function MetricsCards({ summary }: { summary?: Summary }) {
  const s = summary
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Asset Value (USD)"
        value={s ? formatUSD(s.totalAssetValueUSD) : "—"}
        delta={s ? deltaPct(s.change24hPct) : ""}
      />
      <StatCard title="Total Tokens (AG)" value={s ? s.totalAG.toLocaleString() : "—"} />
      <StatCard
        title="Network Status"
        value={s ? statusLabel(s.networkStatus) : "—"}
        valueClass={
          s?.networkStatus === "online"
            ? "text-emerald-600"
            : s?.networkStatus === "degraded"
              ? "text-amber-600"
              : "text-destructive"
        }
      />
    </section>
  )
}

function StatCard({
  title,
  value,
  delta,
  valueClass,
}: { title: string; value: string; delta?: string; valueClass?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${valueClass || ""}`}>{value}</div>
        {delta ? <div className="text-xs text-muted-foreground mt-1">{delta}</div> : null}
      </CardContent>
    </Card>
  )
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function deltaPct(pct: number) {
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}% (24h)`
}
function statusLabel(s: Summary["networkStatus"]) {
  if (s === "online") return "Online"
  if (s === "degraded") return "Degraded"
  return "Offline"
}

export default MetricsCards
