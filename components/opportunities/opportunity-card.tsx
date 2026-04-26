"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RadialBar, RadialBarChart } from "recharts"
import { ArrowUpRight, ArrowDownRight, Bell, Bookmark } from "lucide-react"
import type { Opportunity } from "./data"

function ConfidenceRadial({ value }: { value: number }) {
  const data = [{ name: "confidence", value, fill: "hsl(var(--chart-1))" }]
  return (
    <ChartContainer
      config={{
        confidence: { label: "Confidence", color: "hsl(var(--chart-1))" },
      }}
      className="h-24 w-24"
    >
      <RadialBarChart data={data} innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={-270}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <RadialBar dataKey="value" background cornerRadius={6} />
        {/* Center label */}
        <foreignObject x="25%" y="25%" width="50%" height="50%">
          <div className="flex h-full w-full items-center justify-center text-sm font-medium">{value}%</div>
        </foreignObject>
      </RadialBarChart>
    </ChartContainer>
  )
}

export function OpportunityCard({ item }: { item: Opportunity }) {
  const positive = item.predictedRoiPct >= 0
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Image
          alt={item.imageAlt}
          src={`/placeholder.svg?height=360&width=640&query=property%20exterior%20photo`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
        <div className="absolute left-2 top-2">
          <Badge>AI Recommended</Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-pretty">{item.title}</CardTitle>
        <div className="text-sm text-muted-foreground">{item.location}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ConfidenceRadial value={item.confidence} />
          <div className="flex-1 space-y-1">
            <div className="text-xs text-muted-foreground">Predicted assessment ROI</div>
            <div
              className={`flex items-center gap-1 text-lg font-semibold ${positive ? "text-green-600" : "text-foreground"}`}
            >
              {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {item.predictedRoiPct}%
            </div>
            <div className="text-xs text-muted-foreground">Expected appreciation: {item.appreciationPct}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Risk: {item.riskLevel}</div>
            <div className="text-sm font-semibold">Price</div>
          </div>
          <Progress value={item.riskLevel === "Low" ? 30 : item.riskLevel === "Medium" ? 60 : 85} />
          <div className="text-right text-lg font-semibold">${item.price.toLocaleString()}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Why recommended</div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {item.why.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline">Analyze</Button>
          <Button>Invest Now</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Save opportunity">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Set alert">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
