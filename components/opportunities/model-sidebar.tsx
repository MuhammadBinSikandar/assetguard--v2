"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { Separator } from "@/components/ui/separator"

const perfData = [
  { month: "Jan", predicted: 7.1, actual: 6.8 },
  { month: "Feb", predicted: 7.6, actual: 7.4 },
  { month: "Mar", predicted: 8.0, actual: 7.9 },
  { month: "Apr", predicted: 8.3, actual: 8.2 },
  { month: "May", predicted: 8.7, actual: 8.6 },
  { month: "Jun", predicted: 9.1, actual: 9.0 },
]

export function ModelSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Accuracy</CardTitle>
          <CardDescription>Rolling evaluation (90-day)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Overall accuracy</div>
              <div className="text-2xl font-semibold">95%</div>
            </div>
            <Badge variant="secondary">Stable</Badge>
          </div>
          <Separator />
          <div>
            <div className="text-sm text-muted-foreground mb-2">Predictions vs Actuals</div>
            <ChartContainer
              className="h-48"
              config={{
                predicted: { label: "Predicted ROI", color: "hsl(var(--chart-1))" },
                actual: { label: "Actual ROI", color: "hsl(var(--chart-2))" },
              }}
            >
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" />
                <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Signals powering predictions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Market feeds", "Census", "Listings", "Interest rates", "Rental comps"].map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confidence & Risk</CardTitle>
          <CardDescription>How the model decides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Confidence reflects agreement across data sources and the model’s ensemble variance.</p>
          <p>Risk is derived from volatility, liquidity constraints, and sensitivity to macro factors.</p>
          <a className="text-sm font-medium underline underline-offset-4" href="#" aria-label="Learn how it works">
            Learn How It Works
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
