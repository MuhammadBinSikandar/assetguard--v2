"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ShieldCheck, Bookmark } from "lucide-react"
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

export function PropertyCard({ p }: { p: P }) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="absolute left-2 top-2 flex items-center gap-2">
        {p.verified && (
          <Badge className="inline-flex items-center gap-1" variant="secondary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </Badge>
        )}
      </div>
      <button
        aria-label="Bookmark"
        className="absolute right-2 top-2 rounded-md bg-background/70 p-1 text-foreground shadow hover:bg-background"
      >
        <Bookmark className="h-4 w-4" />
      </button>

      <div className="aspect-[4/3] w-full bg-muted">
        <img
          src="/modern-property-exterior.png"
          alt={`Image of ${p.title}`}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">{p.title}</div>
          <div className="text-lg font-semibold">${p.price.toLocaleString()}</div>
        </div>

        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {p.location}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Tokenization</span>
            <span>{p.progress}%</span>
          </div>
          <Progress value={p.progress} />
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="default" className="w-full sm:w-auto" asChild>
            <Link href={`/properties/${p.id}`}>View Details</Link>
          </Button>
          {/* <div className="transition-opacity group-hover:opacity-100 sm:block hidden">
            <Button variant="secondary">Quick Invest</Button>
          </div> */}
        </div>
      </CardContent>
    </Card>
  )
}
