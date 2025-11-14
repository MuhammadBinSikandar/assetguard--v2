"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Tx = {
  id: string
  date: string
  type: "Deposit" | "Withdraw" | "Buy" | "Sell" | "Dividend"
  property: string
  amount: string
  status: "Pending" | "Completed" | "Failed"
  hash: string
}

const txs: Tx[] = [
  {
    id: "t1",
    date: "2025-07-03",
    type: "Buy",
    property: "Marina View Residence",
    amount: "50 AGT-001",
    status: "Completed",
    hash: "0xabc...123",
  },
  {
    id: "t2",
    date: "2025-07-01",
    type: "Deposit",
    property: "-",
    amount: "$2,500.00",
    status: "Completed",
    hash: "0x222...555",
  },
  {
    id: "t3",
    date: "2025-06-28",
    type: "Dividend",
    property: "Downtown Offices A",
    amount: "$42.10",
    status: "Completed",
    hash: "0xdef...987",
  },
  {
    id: "t4",
    date: "2025-06-21",
    type: "Sell",
    property: "Coastal Land Plot",
    amount: "20 AGT-020",
    status: "Pending",
    hash: "0x999...444",
  },
]

export function TransactionHistory() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filtered = useMemo(() => {
    return txs
      .filter((t) => (type === "all" ? true : t.type === (type as Tx["type"])))
      .filter((t) => (status === "all" ? true : t.status === (status as Tx["status"])))
      .filter((t) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          t.property.toLowerCase().includes(q) || t.amount.toLowerCase().includes(q) || t.hash.toLowerCase().includes(q)
        )
      })
  }, [query, type, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-pretty">Transaction History</CardTitle>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <Input
            placeholder="Search (address, amount, property)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Deposit">Deposit</SelectItem>
              <SelectItem value="Withdraw">Withdraw</SelectItem>
              <SelectItem value="Buy">Buy</SelectItem>
              <SelectItem value="Sell">Sell</SelectItem>
              <SelectItem value="Dividend">Dividend</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              const csv = [
                "Date,Type,Property,Amount,Status,Hash",
                ...filtered.map((t) => [t.date, t.type, t.property, t.amount, t.status, t.hash].join(",")),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "transactions.csv"
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
          >
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{t.property}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell className="font-mono">{t.hash}</TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No transactions found.
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
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => Math.max(1, p - 1))
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => Math.min(totalPages, p + 1))
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  )
}
