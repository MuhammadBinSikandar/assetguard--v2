"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  value: string
  delta: string
  valueHint?: string
  trend: number[]
  colorVar?: string // CSS var for chart color, defaults to --chart-1
  className?: string
}

export function MetricCard({
  title,
  value,
  delta,
  valueHint,
  trend,
  colorVar = "--chart-1",
  className,
}: MetricCardProps) {
  const data = React.useMemo(
    () =>
      trend.map((y, i) => ({
        idx: i + 1,
        value: y,
        label: `T${i + 1}`,
      })),
    [trend],
  )

  const color = `hsl(var(${colorVar}))`

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-semibold">{value}</div>
          <div
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-md",
              delta.startsWith("-")
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
            aria-label="change"
          >
            {delta}
          </div>
        </div>
        {valueHint && <div className="mt-1 text-xs text-muted-foreground">{valueHint}</div>}

        <ChartContainer
          config={{
            value: {
              label: title,
              color,
            },
          }}
          className="mt-3 h-[80px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#metricGradient)"
                dot={false}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
