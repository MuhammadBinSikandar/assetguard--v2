"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, CheckCircle2, Loader2, Users, TrendingUp } from "lucide-react"
import { effectivePropertyValuationUsd } from "@/lib/property-valuation"
import { resolvePropertyPricePerToken, resolvePropertyTokenSupply } from "@/lib/property-tokens"
import { CreateListingDialog } from "@/components/listings/create-listing-dialog"
import { CreateCoownerListingDialog } from "@/components/listings/create-coowner-listing-dialog"


type PropertyItem = {
  id: string
  referenceId: string
  propertyAddress: string
  ownerName: string
  borough: string
  block: string
  lot: string
  propertyType: string
  status: string
  submittedAt: string
  reviewedAt: string | null
  estimatedPriceUSD: number
  verifiedPriceUSD: number | null
  walletAddress: string
  adminNotes: string | null
  mintAddress: string | null
  tokenSupply: number | null
  pricePerToken: number | null
  tokenSymbol: string
  currentWalletTokens: number | null
  listing: { id: string; status: string } | null
  _count: { documents: number }
}

type CoRow = {
  ownershipId: string
  tokensOwned: number
  tokensFromPurchases: number
  tokensInActiveListing: number
  ownershipPercent: number
  estimatedShareUSD: number
  fullValuationUSD: number
  userListing: { id: string; status: string; tokensRemaining: number } | null
  canListSharesForSale: boolean
  property: {
    id: string
    referenceId: string
    borough: string
    block: string
    lot: string
    propertyAddress: string
    mintAddress: string | null
    pricePerToken: number
    tokenSupply: number
    estimatedPriceUSD: number
    verifiedPriceUSD: number | null
  }
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
const fmtUSD = (v: number) => `$${v.toLocaleString()}`


export function TotalPropertiesTab() {
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [coRows, setCoRows] = useState<CoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [r1, r2] = await Promise.all([
        fetch("/api/properties/my-properties", { credentials: "include" }),
        fetch("/api/portfolio/co-owned", { credentials: "include" }),
      ])
      if (!r1.ok) {
        setError("Failed to load properties.")
        return
      }
      const j1 = await r1.json()
      if (j1.success) {
        setProperties((j1.data as PropertyItem[]).filter((p) => p.status === "APPROVED"))
      }
      if (r2.ok) {
        const j2 = await r2.json()
        if (j2.success) setCoRows(j2.data as CoRow[])
      } else {
        setCoRows([])
      }
    } catch {
      setError("Failed to load properties.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])


  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const regIds = new Set(properties.map((p) => p.id))
  const coOnly = coRows.filter((c) => !regIds.has(c.property.id))

  const totalValue =
    properties.reduce(
      (sum, p) => sum + effectivePropertyValuationUsd(p.estimatedPriceUSD, p.verifiedPriceUSD),
      0,
    ) + coOnly.reduce((sum, c) => sum + c.estimatedShareUSD, 0)

  const hasAny = properties.length > 0 || coOnly.length > 0


  if (!hasAny) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">No portfolio holdings yet</h2>
            <p className="text-sm text-muted-foreground">
              Approved properties you register or token shares you buy on the marketplace will show here.
            </p>
          </div>
          <Button asChild>
            <Link href="/register/property">Register a property</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* ── Portfolio Summary Bar ── */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs text-muted-foreground">Total Properties</p>
            <p className="text-2xl font-bold">{properties.length + coOnly.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs text-muted-foreground">Portfolio Value (est.)</p>
            <p className="text-2xl font-bold">{fmtUSD(Math.round(totalValue))}</p>
          </CardContent>
        </Card>
      </section>

      {properties.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Tokenized (your registrations)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const displaySupply = resolvePropertyTokenSupply(property.tokenSupply)
              const alreadyListed = property.listing != null
              const canList =
                property.mintAddress != null &&
                resolvePropertyPricePerToken(
                  property.estimatedPriceUSD,
                  property.verifiedPriceUSD,
                  property.pricePerToken,
                ) > 0

              return (
                <Card key={property.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold leading-tight">{property.propertyAddress}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {property.borough} · Block {property.block} · Lot {property.lot}
                        </p>
                      </div>
                      <Badge variant="default" className="shrink-0 bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    </div>


                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-mono text-xs">{property.referenceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Owner of record</span>
                        <span>{property.ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="capitalize">
                          {property.propertyType.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. value</span>
                        <span className="font-semibold">
                          {fmtUSD(
                            effectivePropertyValuationUsd(
                              property.estimatedPriceUSD,
                              property.verifiedPriceUSD,
                            ),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approved</span>
                        <span>{property.reviewedAt ? fmtDate(property.reviewedAt) : "—"}</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-md bg-accent/50 p-3 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">{property.tokenSymbol} tokens</p>
                      <p className="text-lg font-bold">{displaySupply.toLocaleString()}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {property.tokenSupply != null ? "Minted supply" : "Standard offering (1,000)"}
                      </p>
                      {property.currentWalletTokens != null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Current wallet balance: {property.currentWalletTokens.toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {canList && !alreadyListed && (
                        <CreateListingDialog onSuccess={load}>
                          <Button type="button" size="sm" className="w-full sm:w-auto">
                            List for sale
                          </Button>
                        </CreateListingDialog>
                      )}
                      {canList && alreadyListed && (
                        <Badge variant="secondary" className="w-full justify-center py-1.5 sm:w-auto">
                          Listed
                        </Badge>
                      )}
                    </div>

                    <div
                      className="mt-3 truncate font-mono text-xs text-muted-foreground"
                      title={property.walletAddress}
                    >
                      {property.walletAddress.slice(0, 4)}...{property.walletAddress.slice(-4)}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {coOnly.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Co-invested properties
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Token shares you bought in other users&apos; offerings. You can resell your balance the same way as the
            primary market (subject to on-chain setup).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coOnly.map((c) => {
              const p = c.property
              const listed = c.userListing?.status === "ACTIVE"
              return (
                <Card key={c.ownershipId} className="overflow-hidden">
                  <div className="h-32 bg-muted">
                    <img
                      src="/modern-property-exterior.png"
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="font-mono text-sm font-medium">{p.referenceId}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{p.propertyAddress}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary" className="tabular-nums">
                        {c.tokensOwned.toLocaleString()} / {p.tokenSupply.toLocaleString()} tokens
                      </Badge>
                      <Badge variant="outline" className="tabular-nums">
                        {c.ownershipPercent.toFixed(2)}% stake
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Est. share:{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {c.estimatedShareUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.canListSharesForSale && c.tokensFromPurchases > 0 && p.mintAddress && (
                        <CreateCoownerListingDialog
                          property={p}
                          maxTokensFromBalance={c.tokensFromPurchases}
                          onSuccess={load}
                        >
                          <Button type="button" size="sm" variant="secondary" className="w-full sm:w-auto">
                            List your shares
                          </Button>
                        </CreateCoownerListingDialog>
                      )}
                      {listed && (
                        <Badge variant="secondary" className="justify-center py-1.5">
                          Your listing active
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/properties/${p.id}`}>
                        View property
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
