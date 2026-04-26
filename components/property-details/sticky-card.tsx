"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ShieldCheck, ExternalLink, Copy, Coins } from "lucide-react"
import { useMemo, useState } from "react"
import { BuyTokensModal } from "@/components/property-details/buy-tokens-modal"
import { useToast } from "@/hooks/use-toast"

const DEVNET_CLUSTER = "devnet"

function walletExplorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}?cluster=${DEVNET_CLUSTER}`
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
}

type Info = {
  id: string
  title: string
  location: string
  ownerWalletAddress?: string | null
  price: number
  verified: boolean
  roi: number
  image?: string
  /** Active or sold marketplace listing; null if none */
  listingOffer: {
    listingId: string
    referenceId: string
    status: "ACTIVE" | "SOLD"
    sellerWalletAddress?: string | null
    tokensListed: number
    tokensRemaining: number
    pricePerToken: number
  } | null
  /** Buy modal */
  tokenSale?: {
    agPricePerFractionUSD: number
    availableFractions: number
    totalFractions: number
  }
}

export function PropertyStickyCard({ property }: { property: Info }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const fullWalletAddress = useMemo(() => {
    return property.listingOffer?.sellerWalletAddress ?? property.ownerWalletAddress ?? null
  }, [property.listingOffer?.sellerWalletAddress, property.ownerWalletAddress])

  const userWalletDisplay = fullWalletAddress
    ? shortenAddress(fullWalletAddress)
    : "Not available"

  const handleVerifyOwnership = () => {
    if (!fullWalletAddress) {
      toast({
        title: "No wallet",
        description: "Connect your Solana wallet or link one in settings to verify token balances on devnet.",
        variant: "destructive",
      })
      return
    }
    window.open(walletExplorerAddressUrl(fullWalletAddress), "_blank", "noopener,noreferrer")
  }

  const handleCopyWallet = () => {
    if (!fullWalletAddress) {
      toast({
        title: "No wallet",
        description: "Connect your Solana wallet or link one in settings.",
        variant: "destructive",
      })
      return
    }
    void navigator.clipboard.writeText(fullWalletAddress)
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    })
  }

  return (
    <>
      <Card className="border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">{property.title}</h1>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {property.location}
              </div>
            </div>
            {property.verified && (
              <Badge className="inline-flex items-center gap-1" variant="secondary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
          </div>

          <div className="text-3xl font-bold">${property.price.toLocaleString()}</div>

          <div className="rounded-md border bg-muted/30 p-3 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Coins className="h-4 w-4" />
              Marketplace listing
            </div>
            {property.listingOffer?.status === "ACTIVE" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Tokens remaining for sale</div>
                  <div className="text-base font-semibold tabular-nums">
                    {property.listingOffer.tokensRemaining.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Price per token</div>
                  <div className="text-base font-semibold tabular-nums">
                    {fmtUSD(property.listingOffer.pricePerToken)}
                  </div>
                </div>
              </div>
            ) : property.listingOffer?.status === "SOLD" ? (
              <p className="text-sm text-muted-foreground">
                This listing is marked sold
                {property.listingOffer.tokensListed > 0
                  ? ` (${property.listingOffer.tokensListed.toLocaleString()} tokens at ${fmtUSD(property.listingOffer.pricePerToken)} / token).`
                  : "."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active marketplace listing. Valuation above reflects the full property estimate.
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Owner Wallet Address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono break-all" title={fullWalletAddress ?? undefined}>
                {userWalletDisplay}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!fullWalletAddress}
                onClick={handleCopyWallet}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleVerifyOwnership}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Verify owner tokens on Solana Explorer (devnet)
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={!property.listingOffer || property.listingOffer.status !== "ACTIVE"}
              onClick={() => setOpen(true)}
            >
              Buy tokens
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Add to Watchlist
            </Button>
            {/* <Button variant="secondary" className="sm:w-auto">
              Share
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {property.listingOffer?.status === "ACTIVE" && (
        <BuyTokensModal
          open={open}
          onOpenChange={setOpen}
          listingId={property.listingOffer.listingId}
          propertyTitle={property.title}
          referenceId={property.listingOffer.referenceId}
          pricePerTokenUsd={property.listingOffer.pricePerToken}
          tokensMax={property.listingOffer.tokensRemaining}
          totalFractions={property.tokenSale?.totalFractions ?? 1000}
        />
      )}
    </>
  )
}
