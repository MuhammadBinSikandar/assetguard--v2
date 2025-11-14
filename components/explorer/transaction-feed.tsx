"use client"

import type React from "react"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Tx = {
  id: string
  hash: string
  type: "transfer" | "mint" | "burn"
  from: string
  to: string
  token?: string
  amount: number
  timestamp: string
  status: "success" | "pending" | "failed"
  block: number
  fee: number
  gasUsed: number
  confirmations: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TransactionFeed() {
  const { data, isLoading } = useSWR("/api/explorer/transactions", fetcher, { refreshInterval: 10000 })
  const [expanded, setExpanded] = useState<string | null>(null)
  const txs: Tx[] = data?.transactions ?? []

  const items = useMemo(() => txs.slice(0, 25), [txs])

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>
  if (!items.length) return <Card className="p-4 text-sm text-muted-foreground">No transactions found.</Card>

  return (
    <div className="space-y-2">
      {items.map((tx) => {
        const isOpen = expanded === tx.id
        return (
          <Card key={tx.id} className="p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <HashCopy hash={tx.hash} />
                  <Badge variant="secondary" className="capitalize">
                    {tx.type}
                  </Badge>
                  <Badge
                    className={cn(
                      "capitalize",
                      tx.status === "success" && "bg-emerald-500/15 text-emerald-600",
                      tx.status === "pending" && "bg-amber-500/15 text-amber-600",
                      tx.status === "failed" && "bg-red-500/15 text-red-600",
                    )}
                  >
                    {tx.status}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  From {short(tx.from)} → {short(tx.to)} • {tx.token ?? "—"} • {tx.amount} AG •{" "}
                  {relativeTime(tx.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <a href={`https://solscan.io/tx/${tx.hash}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    View in Solscan
                  </a>
                </Button>
                <Button size="sm" onClick={() => setExpanded(isOpen ? null : tx.id)} aria-expanded={isOpen}>
                  {isOpen ? "Hide" : "Expand"}
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <Detail label="Transaction Hash">
                  <Copyable value={tx.hash} />
                </Detail>
                <Detail label="Block">
                  <a
                    href={`https://solscan.io/block/${tx.block}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    {tx.block}
                  </a>
                </Detail>
                <Detail label="Timestamp">{new Date(tx.timestamp).toLocaleString()}</Detail>
                <Detail label="From">
                  <Copyable value={tx.from} />
                </Detail>
                <Detail label="To">
                  <Copyable value={tx.to} />
                </Detail>
                <Detail label="Property Token">{tx.token ?? "—"}</Detail>
                <Detail label="Amount">{tx.amount} AG</Detail>
                <Detail label="Fee">{tx.fee} lamports</Detail>
                <Detail label="Gas Used">{tx.gasUsed}</Detail>
                <Detail label="Confirmations">{tx.confirmations}</Detail>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function short(s: string) {
  return s.length <= 10 ? s : `${s.slice(0, 6)}...${s.slice(-4)}`
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.max(1, Math.round(diff / 60000))
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
  const hrs = Math.round(mins / 60)
  return `${hrs} hr${hrs === 1 ? "" : "s"} ago`
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium break-all">{children}</div>
    </div>
  )
}

function HashCopy({ hash }: { hash: string }) {
  return (
    <div className="flex items-center gap-1">
      <code className="text-xs">{short(hash)}</code>
      <CopyButton value={hash} />
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="text-xs underline underline-offset-4 text-primary hover:opacity-80"
      onClick={() => navigator.clipboard.writeText(value)}
    >
      Copy
    </button>
  )
}

function Copyable({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={value} className="h-8 text-xs" />
      <CopyButton value={value} />
    </div>
  )
}
