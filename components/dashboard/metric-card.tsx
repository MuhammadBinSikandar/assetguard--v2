"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  value: string
  delta: string
  /** Hide the change badge (e.g. when there is no historical comparison). */
  hideDelta?: boolean
  valueHint?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  delta,
  hideDelta = false,
  valueHint,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-semibold">{value}</div>
          {!hideDelta && (
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
          )}
        </div>
        {valueHint && <div className="mt-1 text-xs text-muted-foreground">{valueHint}</div>}
      </CardContent>
    </Card>
  )
}
