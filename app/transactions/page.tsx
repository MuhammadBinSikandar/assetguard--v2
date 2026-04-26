"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DEVNET = "devnet"
function txUrl(sig: string | null) {
  if (!sig) return null
  return `https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=${DEVNET}`
}

type Row = {
  id: string
  type: "Bought" | "Sold"
  createdAt: string
  propertyReferenceId: string
  tokens: number
  totalSolPaid: number
  sellerReceivedSol: number
  platformFeeSol: number
  counterpartyEmail: string
  status: string
  solTransferTxHash: string | null
  tokenTransferTxHash: string | null
  solReleaseTxHash: string | null
  refundTxHash: string | null
}

function statusVariant(s: string) {
  const u = s.toUpperCase()
  if (u === "COMPLETED") return "default" as const
  if (u === "FAILED") return "destructive" as const
  return "secondary" as const
}

export default function TransactionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/transactions/my-transactions", { credentials: "include" })
      if (!res.ok) {
        setRows([])
        return
      }
      const j = await res.json()
      if (j.success) setRows(j.data)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-balance">Transaction history</h1>
        <p className="text-muted-foreground text-sm">
          Trades where you are the buyer or the seller — on-chain pay, token, and release / refund
          links when available.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No token transactions yet. Buy or sell on the{" "}
            <a className="text-primary underline" href="/properties">
              marketplace
            </a>
            .
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>With</TableHead>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Your side (SOL)</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(r.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.type === "Bought" ? "default" : "secondary"}>{r.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm" title={r.counterpartyEmail}>
                    {r.counterpartyEmail}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.propertyReferenceId}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.tokens}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.type === "Bought"
                      ? r.totalSolPaid.toFixed(4)
                      : r.sellerReceivedSol.toFixed(4)}
                    <span className="sr-only">
                      {r.type === "Bought" ? " paid" : " received"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.platformFeeSol.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {r.solTransferTxHash && (
                        <a
                          className="text-primary inline-flex items-center gap-0.5 hover:underline"
                          href={txUrl(r.solTransferTxHash) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          pay <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {r.tokenTransferTxHash && (
                        <a
                          className="text-primary inline-flex items-center gap-0.5 hover:underline"
                          href={txUrl(r.tokenTransferTxHash) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          token <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {r.solReleaseTxHash && (
                        <a
                          className="text-primary inline-flex items-center gap-0.5 hover:underline"
                          href={txUrl(r.solReleaseTxHash) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          release <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {r.refundTxHash && (
                        <a
                          className="text-primary inline-flex items-center gap-0.5 hover:underline"
                          href={txUrl(r.refundTxHash) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          refund <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
