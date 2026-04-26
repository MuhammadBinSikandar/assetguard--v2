"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useCallback, useEffect, useState } from "react"

const DEVNET = "devnet"
function txUrl(sig: string | null) {
  if (!sig) return null
  return `https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=${DEVNET}`
}

type OverviewProps = {
  propertyId: string
  property: {
    title: string
    description: string
    features: string[]
    amenities: string[]
    neighborhood: string
  }
}

// mock data for charts
const priceHistory = [
  { m: "Jan", price: 100 },
  { m: "Feb", price: 102 },
  { m: "Mar", price: 101 },
  { m: "Apr", price: 104 },
  { m: "May", price: 107 },
  { m: "Jun", price: 110 },
]

const roiProjection = [
  { y: "Year 1", roi: 5.4 },
  { y: "Year 2", roi: 6.2 },
  { y: "Year 3", roi: 6.8 },
  { y: "Year 4", roi: 7.1 },
  { y: "Year 5", roi: 7.3 },
]

const comparables = [
  { id: "c1", title: "Marina Heights Apt", price: "$115,000" },
  { id: "c2", title: "Bayview Residence", price: "$132,000" },
  { id: "c3", title: "Harbor Point Loft", price: "$128,500" },
]

type OwnerRow = {
  id: string
  userId?: string
  name: string
  walletAddress: string | null
  /** Solana Explorer — wallet address page */
  walletExplorerUrl: string | null
  /** Solana Explorer — this wallet's token account for the property mint (Token-2022) */
  tokenAccountExplorerUrl: string | null
  tokensOwned: number
  ownershipPercent: number
  acquiredAt: string
  isRegistrant?: boolean
}
type SaleRow = {
  id: string
  createdAt: string
  buyerWallet: string
  sellerWallet: string
  tokensBought: number
  totalSolPaid: number
  platformFeeSol: number
  status: string
  solTransferTxHash: string | null
  tokenTransferTxHash: string | null
  solReleaseTxHash: string | null
}

function shortAddr(a: string) {
  if (a.length <= 12) return a
  return `${a.slice(0, 5)}…${a.slice(-4)}`
}

export function PropertyTabs({ propertyId, property }: OverviewProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [ownLoading, setOwnLoading] = useState(true)
  const [owners, setOwners] = useState<OwnerRow[]>([])
  const [sales, setSales] = useState<SaleRow[]>([])

  const loadOwnership = useCallback(async () => {
    setOwnLoading(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/ownership`)
      const j = await res.json()
      if (j.success && j.data) {
        setOwners(j.data.owners)
        setSales(j.data.purchases)
      }
    } catch {
      setOwners([])
      setSales([])
    } finally {
      setOwnLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    void loadOwnership()
  }, [loadOwnership])

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex w-full flex-wrap gap-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="owners">Current owners</TabsTrigger>
        <TabsTrigger value="sales">Transaction history</TabsTrigger>
        <TabsTrigger value="valuation">Valuation Report</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm text-foreground">{property.description}</p>

            <section>
              <h3 className="mb-2 text-sm font-medium">Key Features</h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {property.features.map((f, i) => (
                  <li key={i} className="inline-flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium">Amenities</h3>
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {property.amenities.map((a, i) => (
                  <li key={i} className="rounded border px-2 py-1">
                    {a}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium">Neighborhood</h3>
              <p className="text-sm text-muted-foreground">{property.neighborhood}</p>
            </section>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="valuation" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium">Price Prediction</h3>
              <div className="h-56">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="m" />
                      <YAxis />
                      <Tooltip />
                      <Line dataKey="price" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-medium">Valuation Score</h3>
              <div className="text-4xl font-semibold">8.6/10</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on liquidity, rental demand, and comparable sales.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-medium">Comparable Properties</h3>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {comparables.map((c) => (
                <li key={c.id} className="rounded border p-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-muted-foreground">{c.price}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="owners" className="space-y-4">
        <Card>
          <CardContent className="p-0">
            {ownLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Ownership %</TableHead>
                    <TableHead>Acquired at</TableHead>
                    <TableHead>On-chain (Solana)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No ownership data yet. The registrant and buyers appear here after registration and
                        sales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    owners.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{o.name || (o.walletAddress ? shortAddr(o.walletAddress) : "—")}</span>
                            {o.isRegistrant && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                Registrant
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{o.tokensOwned.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.ownershipPercent.toFixed(2)}%</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(o.acquiredAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {o.tokenAccountExplorerUrl || o.walletExplorerUrl ? (
                            <div className="flex flex-col gap-1">
                              {o.tokenAccountExplorerUrl ? (
                                <a
                                  className="text-primary inline-flex items-center gap-0.5 hover:underline"
                                  href={o.tokenAccountExplorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Token balance <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                              {o.walletExplorerUrl ? (
                                <a
                                  className="text-muted-foreground inline-flex items-center gap-0.5 hover:underline"
                                  href={o.walletExplorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Wallet <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sales" className="space-y-4">
        <Card>
          <CardContent className="p-0">
            {ownLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">SOL</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Explorers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                        No completed purchases recorded for this property yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(s.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{shortAddr(s.buyerWallet)}</TableCell>
                        <TableCell className="font-mono text-xs">{shortAddr(s.sellerWallet)}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.tokensBought}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.totalSolPaid.toFixed(4)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {s.platformFeeSol.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-1">
                            {s.solTransferTxHash && (
                              <a
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                                href={txUrl(s.solTransferTxHash) ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                              >
                                pay <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {s.tokenTransferTxHash && (
                              <a
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                                href={txUrl(s.tokenTransferTxHash) ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                              >
                                token <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {s.solReleaseTxHash && (
                              <a
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                                href={txUrl(s.solReleaseTxHash) ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                              >
                                release <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  )
}
