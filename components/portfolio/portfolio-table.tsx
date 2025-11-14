"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import Link from "next/link"

type Item = {
  id: string
  name: string
  location: string
  ownership: "full" | "fractional"
  fractionalPercent?: number
  purchasePriceSOL: number
  currentValueSOL: number
  purchaseDate: string
  image?: string
}

const fmtSOL = (v: number) => `${v.toLocaleString()} SOL`
const fmtUSD = (v: number) => `($${(v * 120).toLocaleString()})`
const roiPct = (purchase: number, current: number) => ((current - purchase) / Math.max(1, purchase)) * 100

export function PortfolioTable({ items }: { items: Item[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Property</th>
            <th className="px-3 py-2 text-left font-medium">Ownership</th>
            <th className="px-3 py-2 text-left font-medium">Purchase Price</th>
            <th className="px-3 py-2 text-left font-medium">Current Value</th>
            <th className="px-3 py-2 text-left font-medium">ROI</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const roi = roiPct(p.purchasePriceSOL, p.currentValueSOL)
            const isGain = roi >= 0
            return (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image || "/placeholder.svg?height=48&width=64&query=Property"}
                      alt=""
                      className="h-12 w-16 rounded object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.location}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {p.ownership === "full" ? "Full" : `Fractional (${p.fractionalPercent ?? 0}%)`}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium">{fmtSOL(p.purchasePriceSOL)}</div>
                  <div className="text-xs text-muted-foreground">{fmtUSD(p.purchasePriceSOL)}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium">{fmtSOL(p.currentValueSOL)}</div>
                  <div className="text-xs text-muted-foreground">{fmtUSD(p.currentValueSOL)}</div>
                </td>
                <td className="px-3 py-3">
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
                </td>
                <td className="px-3 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`More actions for ${p.name}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/properties/${p.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Sell Fractions</DropdownMenuItem>
                      <DropdownMenuItem className="inline-flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on Blockchain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
