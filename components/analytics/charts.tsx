"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

type Series = {
  valuationUSD: Array<{ ts: string; value: number }>
  registrations: Array<{ day: string; count: number }>
  transfers: Array<{ day: string; count: number }>
}

export function AnalyticsCharts({ series }: { series?: Series }) {
  const valuation = series?.valuationUSD ?? []
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section className="grid grid-cols-1 gap-6">
      <Card className="h-[360px]">
        <CardHeader>
          <CardTitle>Total Asset Valuation (USD)</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valuation} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="ts"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  tick={{ fill: 'currentColor' }}
                  style={{ color: 'hsl(var(--foreground))' }}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  tick={{ fill: 'currentColor' }}
                  style={{ color: 'hsl(var(--foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valuation']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  name="Valuation"
                  dot={{
                    fill: 'hsl(var(--card-foreground))',
                    strokeWidth: 2,
                    r: 5,
                    stroke: 'hsl(var(--chart-1))',
                    className: 'fill-foreground'
                  }}
                  activeDot={{
                    r: 7,
                    fill: 'hsl(var(--card-foreground))',
                    stroke: 'hsl(var(--chart-1))',
                    strokeWidth: 2,
                    className: 'fill-foreground'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full" />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default AnalyticsCharts
