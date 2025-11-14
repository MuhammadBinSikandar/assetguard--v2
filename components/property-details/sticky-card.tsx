"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ShieldCheck, Bed, Bath, Calendar, ExternalLink, Copy } from "lucide-react"
import { useState } from "react"
import { BuyFractionsModal } from "@/components/property-details/buy-fractions-modal"
import { useToast } from "@/hooks/use-toast"

type Info = {
  id: string
  title: string
  location: string
  price: number
  verified: boolean
  size: string
  bedrooms: number
  bathrooms: number
  yearBuilt: number
  roi: number
  image?: string
}

export function PropertyStickyCard({ property }: { property: Info }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Mock user wallet address - in production, this would come from actual wallet connection
  const userWalletAddress = "7xKX...9mPq"
  const fullWalletAddress = "7xKXy8mN9zLp4QrWvT3aH5bC2dE6fG9mPq"

  const handleVerifyOwnership = () => {
    // Redirect to Solana blockchain explorer with user's wallet address
    const explorerUrl = `https://explorer.solana.com/address/${fullWalletAddress}`
    window.open(explorerUrl, "_blank")
  }

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(fullWalletAddress)
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

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Size</div>
              <div>{property.size}</div>
            </div>
            <div className="inline-flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{property.bedrooms} bd</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{property.bathrooms} ba</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Built {property.yearBuilt || "—"}</span>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Predicted ROI: </span>
            <span className="text-emerald-600 font-medium">+{property.roi}%</span>
          </div>

          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Your Wallet Address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono">{userWalletAddress}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
              Verify Ownership on Explorer
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => setOpen(true)}>
              Buy Fractions
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Add to Watchlist
            </Button>
            <Button variant="secondary" className="sm:w-auto">
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <BuyFractionsModal
        open={open}
        onOpenChange={setOpen}
        property={{
          id: property.id,
          title: property.title,
          // For image, we pass a placeholder; page will pass the real image via prop extension
          image: property.image || "/modern-house-exterior.png",
          agPricePerFractionUSD: 100, // demo price per fraction
          availableFractions: 650,
          totalFractions: 1000,
          roi: property.roi,
        }}
        walletBalanceSol={25.4}
        conversion={{ solUsd: 150 }}
      />
    </>
  )
}
