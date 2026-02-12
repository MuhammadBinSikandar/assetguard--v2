"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { RefreshCw, ExternalLink, FileText } from "lucide-react"

interface SolanaTx {
  id: string
  signature: string
  timestamp: string
  slot: number
  fee: number
  status: "Confirmed" | "Failed"
  type: string
}

interface TransactionHistoryProps {
  walletAddress?: string | null
}

export function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [transactions, setTransactions] = useState<SolanaTx[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const owner = publicKey ?? (walletAddress ? new PublicKey(walletAddress) : null)
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
  const explorerClusterQuery = network === "mainnet-beta" ? "" : `?cluster=${network}`

  const fetchTransactions = useCallback(async () => {
    if (!owner) { setLoading(false); return }

    try {
      setLoading(true)

      // Fetch last 20 confirmed signatures
      const signatures = await connection.getSignaturesForAddress(owner, { limit: 20 })

      const txs: SolanaTx[] = signatures.map((sig, i) => {
        const ts = sig.blockTime
          ? new Date(sig.blockTime * 1000).toISOString().replace("T", " ").slice(0, 19)
          : "—"

        return {
          id: `tx-${i}`,
          signature: sig.signature,
          timestamp: ts,
          slot: sig.slot,
          fee: 0.000005, // Standard tx fee on Solana
          status: sig.err ? "Failed" : "Confirmed",
          type: sig.memo ?? "Transaction",
        }
      })

      setTransactions(txs)
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
    } finally {
      setLoading(false)
    }
  }, [connection, owner])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const filtered = useMemo(() => {
    if (!query.trim()) return transactions
    const q = query.toLowerCase()
    return transactions.filter(
      (t) =>
        t.signature.toLowerCase().includes(q) ||
        t.timestamp.includes(q) ||
        t.status.toLowerCase().includes(q),
    )
  }, [query, transactions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const exportCSV = () => {
    const csv = [
      "Timestamp,Signature,Slot,Fee (SOL),Status",
      ...filtered.map((t) =>
        [t.timestamp, t.signature, t.slot, t.fee, t.status].join(","),
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "solana_transactions.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-pretty">Transaction History</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchTransactions} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            placeholder="Search by signature, date…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />
          <div />
          <Button variant="secondary" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No transactions found for this wallet.</p>
          </div>
        ) : (
          <>
            <div className="relative w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead className="text-right">Slot</TableHead>
                    <TableHead className="text-right">Fee (SOL)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Explorer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.timestamp}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {t.signature.slice(0, 8)}...{t.signature.slice(-6)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{t.slot.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{t.fee}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "Confirmed" ? "default" : "destructive"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://explorer.solana.com/tx/${t.signature}${explorerClusterQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No transactions match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {pageItems.length} of {filtered.length}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
