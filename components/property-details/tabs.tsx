"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ExternalLink } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import Link from "next/link"

type OverviewProps = {
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

const ownershipHistory = [
  { date: "2021-03-10", event: "Tokenization Event", tx: "0x9f2c...a1e4" },
  { date: "2022-08-21", event: "Ownership Transfer", tx: "0x4b7d...c902" },
  { date: "2024-01-09", event: "Fraction Buyback", tx: "0x1a3e...ff45" },
]

const comparables = [
  { id: "c1", title: "Marina Heights Apt", price: "$115,000" },
  { id: "c2", title: "Bayview Residence", price: "$132,000" },
  { id: "c3", title: "Harbor Point Loft", price: "$128,500" },
]

export function PropertyTabs({ property }: OverviewProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex w-full flex-wrap gap-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="ownership">Ownership History</TabsTrigger>
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
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="price" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
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

      <TabsContent value="ownership" className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              Blockchain Verified
            </div>

            <ol className="relative border-l pl-4">
              {ownershipHistory.map((h, idx) => (
                <li key={idx} className="mb-4">
                  <div className="absolute -left-2 h-4 w-4 rounded-full border bg-background"></div>
                  <div className="text-sm font-medium">{h.event}</div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                  <div className="mt-1 text-xs">
                    Tx:{" "}
                    <Link
                      href={`https://etherscan.io/tx/${h.tx}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {h.tx} <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  )
}
