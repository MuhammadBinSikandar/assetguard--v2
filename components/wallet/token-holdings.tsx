"use client"

import { useState, Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react"

type Holding = {
  id: string
  token: string
  property: string
  verified: boolean
  qty: number
  valueUsd: number
}

const holdings: Holding[] = [
  {
    id: "h1",
    token: "AGT-001",
    property: "Marina View Residence",
    verified: true,
    qty: 250,
    valueUsd: 12500,
  },
  {
    id: "h2",
    token: "AGT-014",
    property: "Downtown Offices A",
    verified: true,
    qty: 120,
    valueUsd: 8400,
  },
  {
    id: "h3",
    token: "AGT-020",
    property: "Coastal Land Plot",
    verified: false,
    qty: 75,
    valueUsd: 3630,
  },
]

export function TokenHoldings() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-pretty">Token Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Token</TableHead>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => {
                const open = openId === h.id
                return (
                  <Fragment key={h.id}>
                    <TableRow data-state={open ? "open" : "closed"}>
                      <TableCell className="w-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={open ? "Collapse" : "Expand"}
                          aria-expanded={open}
                          aria-controls={`details-${h.id}`}
                          onClick={() => setOpenId(open ? null : h.id)}
                        >
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="inline-flex items-center gap-2">
                          {h.token}
                          {h.verified && (
                            <Badge variant="secondary" className="inline-flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{h.property}</TableCell>
                      <TableCell className="text-right">{h.qty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${h.valueUsd.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm">
                          Sell Tokens
                        </Button>
                      </TableCell>
                    </TableRow>

                    {open && (
                      <TableRow id={`details-${h.id}`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-3">
                          <div className="text-xs text-muted-foreground mb-2">Recent Transactions for {h.token}</div>
                          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                            <div className="rounded-md border p-3">
                              <div className="font-medium">2025-07-03</div>
                              <div>Type: Buy</div>
                              <div>Amount: 50</div>
                              <div>Hash: 0xabc...123</div>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="font-medium">2025-06-28</div>
                              <div>Type: Dividend</div>
                              <div>Amount: $42.10</div>
                              <div>Hash: 0xdef...987</div>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="font-medium">2025-06-11</div>
                              <div>Type: Sell</div>
                              <div>Amount: 20</div>
                              <div>Hash: 0xaaa...555</div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
