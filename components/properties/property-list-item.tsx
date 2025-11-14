"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ShieldCheck } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

type P = {
  id: string
  title: string
  location: string
  price: number
  verified: boolean
  type: "Residential" | "Commercial" | "Land"
  size: string
  roi: number
  progress: number
}

export function PropertyListItem({ p }: { p: P }) {
  return (
    <Card className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[220px_1fr]">
      <div className="aspect-[4/3] w-full bg-muted">
        <img
          src="/interior-property-living-room.jpg"
          alt={`Image of ${p.title}`}
          className="h-full w-full object-cover rounded"
          crossOrigin="anonymous"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="text-lg font-semibold">{p.title}</div>
              {p.verified && (
                <Badge className="inline-flex items-center gap-1" variant="secondary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {p.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="text-xl font-semibold">${p.price.toLocaleString()}</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Premium property opportunity with stable rental yields and strong appreciation outlook. Tokenized for
          fractional access and liquidity.
        </p>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Size</div>
            <div>{p.size}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Type</div>
            <div>{p.type}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Predicted ROI</div>
            <div className="text-emerald-600">+{p.roi}%</div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Tokenization</span>
            <span>{p.progress}%</span>
          </div>
          <Progress value={p.progress} />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary">Investment Calculator</Button>
          <Button asChild>
            <Link href={`/properties/${p.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
