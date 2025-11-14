"use client"
import useSWR from "swr"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"

type TxStatus = "completed" | "pending" | "failed"
type TxType = "purchase" | "sale" | "transfer" | "registration"

type TxItem = {
  id: string
  type: TxType
  property: string
  amountAG: number
  status: TxStatus
  hash: string
  from: string
  to: string
  timestamp: string // ISO
  contract?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TransactionsPage() {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<TxItem | null>(null)

  const { data } = useSWR<{ items: TxItem[]; total: number }>(
    `/api/transactions?page=${page}&type=${typeFilter}&status=${statusFilter}&q=${encodeURIComponent(search)}`,
    fetcher,
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const onCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const statusBadge = (s: TxStatus) => {
    const map: Record<TxStatus, { label: string; className: string }> = {
      completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
      pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
      failed: { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-200" },
    }
    const cfg = map[s]
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    )
  }

  const truncate = (v: string, head = 6, tail = 4) => {
    if (v.length <= head + tail) return v
    return `${v.slice(0, head)}...${v.slice(-tail)}`
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* <DashboardSidebar /> */}
      <SidebarInset className="min-h-svh">
        {/* <TopBar /> */}
        <main className="px-4 pb-10 pt-4 md:px-6">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-balance">Transaction History</h1>
            <p className="text-muted-foreground">Your latest transactions appear below.</p>
          </header>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[220px]">
                  <Input
                    placeholder="Search by property, hash, wallet..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search transactions"
                  />
                </div>
                <div className="min-w-[160px]">
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setTypeFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger aria-label="Filter by type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="registration">Registration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger aria-label="Filter by status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No transactions yet. Your transaction history will appear here once you start investing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((tx) => (
                <Card key={tx.id} className="hover:bg-muted/50 transition">
                  <CardContent className="py-4">
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3">
                        <div className="text-sm font-medium">{new Date(tx.timestamp).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="col-span-2 capitalize">{tx.type}</div>
                      <div className="col-span-2 truncate">{tx.property}</div>
                      <div className="col-span-2">{tx.amountAG.toLocaleString()} AG</div>
                      <div className="col-span-1">{statusBadge(tx.status)}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        <code className="text-xs">{truncate(tx.hash)}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Copy transaction hash"
                          onClick={() => onCopy(tx.hash)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View on Explorer"
                          onClick={() => window.open(`/explorer?tx=${tx.hash}`, "_blank")}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelected(tx)}>
                          View
                        </Button>
                      </div>
                    </div>
                    {/* Mobile row */}
                    <div className="md:hidden flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium capitalize">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">{tx.amountAG.toLocaleString()} AG</div>
                        <div className="text-xs mt-1">
                          <code>{truncate(tx.hash)}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(tx.status)}
                        <Button size="sm" variant="outline" onClick={() => setSelected(tx)}>
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>

          {/* Details Modal */}
          <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-3">
                  <Row label="Transaction ID" value={selected.id} />
                  <Row label="Transaction Type" value={selected.type} />
                  <Row label="Property" value={selected.property} />
                  <Row label="Amount" value={`${selected.amountAG.toLocaleString()} AG`} />
                  <Row label="Date & Time" value={new Date(selected.timestamp).toLocaleString()} />
                  <Row label="Status" valueClass="capitalize" value={selected.status} />
                  <Row label="From" value={selected.from} copy />
                  <Row label="To" value={selected.to} copy />
                  {selected.contract && <Row label="Smart Contract" value={selected.contract} copy />}
                  <Row label="Transaction Hash" value={selected.hash} copy />
                  <Separator />
                  <Button onClick={() => window.open(`/explorer?tx=${selected.hash}`, "_blank")} className="w-full">
                    View on Blockchain Explorer
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Row({
  label,
  value,
  copy,
  valueClass,
}: { label: string; value: string; copy?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm break-all flex items-center gap-2">
        <span className={valueClass}>{value}</span>
        {copy && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Copy ${label}`}
            onClick={() => navigator.clipboard.writeText(value)}
          >
            <Copy className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
