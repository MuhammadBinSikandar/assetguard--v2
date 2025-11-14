"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type Alert = {
  id: string
  ts: string
  type: "surge" | "drop" | "info"
  message: string
}

export function RealTimeAlerts() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource("/api/analytics/events")
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const alert: Alert = JSON.parse(e.data)
        // Skip the initial connection message
        if (alert.type === "info" && alert.message === "Analytics stream connected") {
          return
        }

        setAlerts((prev) => [alert, ...prev].slice(0, 4))

        // Show toast notification for important alerts
        if (alert.type === "surge" || alert.type === "drop") {
          toast({
            title: alert.type === "surge" ? "Portfolio Surge" : "Portfolio Drop",
            description: alert.message,
          })
        }
      } catch (err) {
        // Ignore parse errors
      }
    }
    es.onerror = () => {
      // leave quietly; stream will close
    }
    return () => {
      es.close()
    }
  }, [toast])

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "surge":
        return "default"
      case "drop":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case "surge":
        return "Surge"
      case "drop":
        return "Drop"
      default:
        return "Info"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Listening for significant property changes…</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.ts).toLocaleString()}</div>
                </div>
                <Badge variant={getBadgeVariant(a.type)} className="whitespace-nowrap">
                  {getBadgeLabel(a.type)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
