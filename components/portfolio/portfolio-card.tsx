"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, MapPin, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import Link from "next/link"

type Item = {
  id: string
  name: string
  location: string
  ownership: "full" | "fractional"
  fractionalPercent?: number
  purchasePriceSOL: number
  currentValueSOL: number
  image?: string
}

const fmtSOL = (v: number) => `${v.toLocaleString()} SOL`
const fmtUSD = (v: number) => `($${(v * 120).toLocaleString()})`
const roiPct = (purchase: number, current: number) => ((current - purchase) / Math.max(1, purchase)) * 100

export function PortfolioCard({ item }: { item: Item }) {
  const roi = roiPct(item.purchasePriceSOL, item.currentValueSOL)
  const isGain = roi >= 0

  return (
    <Card className="group overflow-hidden">
      <div className="relative">
        <div className="aspect-[4/3] w-full bg-muted">
          <img
            src={item.image || "/placeholder.svg?height=240&width=320&query=Property"}
            alt={`Image of ${item.name}`}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        </div>

        <div className="absolute left-2 top-2 flex items-center gap-2">
          <Badge variant="secondary">
            {item.ownership === "full" ? "Full" : `Fractional (${item.fractionalPercent ?? 0}%)`}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More actions"
              className="absolute right-2 top-2 rounded-md bg-background/70 p-1 text-foreground shadow transition hover:bg-background"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/properties/${item.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Sell Fractions</DropdownMenuItem>
            <DropdownMenuItem className="inline-flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              View on Blockchain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[140px]">{item.location}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Current Value</div>
            <div className="font-medium">
              {fmtSOL(item.currentValueSOL)}{" "}
              <span className="text-xs text-muted-foreground">{fmtUSD(item.currentValueSOL)}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Purchase Price</div>
            <div className="font-medium">
              {fmtSOL(item.purchasePriceSOL)}{" "}
              <span className="text-xs text-muted-foreground">{fmtUSD(item.purchasePriceSOL)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="inline-flex items-center gap-1 font-medium">
            {isGain ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span className={isGain ? "text-emerald-600" : "text-red-600"}>
              {isGain ? "+" : ""}
              {roi.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{isGain ? "Profit" : "Loss"} vs. purchase</div>
        </div>

        <div className="flex items-center justify-between">
          <Button asChild>
            <Link href={`/properties/${item.id}`}>View Details</Link>
          </Button>
          <Button variant="secondary">Sell Fractions</Button>
        </div>
      </CardContent>
    </Card>
  )
}
