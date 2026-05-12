"use client"

import { useState, useMemo } from "react"
import type { BoroughStat } from "@/types/roi"

interface OpportunitiesMapProps {
  boroughs: BoroughStat[]
  loading?: boolean
}

/**
 * Self-contained SVG heatmap of NYC's 5 boroughs.
 * Color intensity is based on average ROI (dark green = high, yellow, red = low).
 * Hover reveals borough name, avg ROI, and property count.
 */
export function OpportunitiesMap({ boroughs, loading }: OpportunitiesMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Build lookup by borough name (normalised to lowercase)
  const lookup = useMemo(() => {
    const map = new Map<string, BoroughStat>()
    for (const b of boroughs) {
      map.set(b.name.toLowerCase(), b)
    }
    return map
  }, [boroughs])

  // Compute color from ROI (0–20% range mapped to red→yellow→green)
  function roiToColor(boroughName: string): string {
    const stat = lookup.get(boroughName.toLowerCase())
    if (!stat || stat.propertyCount === 0) return "hsl(220, 15%, 25%)" // neutral gray for no data

    const roi = Math.max(0, Math.min(stat.avgROI, 20))
    // Map 0–20% to hue 0 (red) → 60 (yellow) → 140 (green)
    const hue = (roi / 20) * 140
    const saturation = 55 + roi * 1.5
    const lightness = 35 + Math.min(roi, 10) * 1.5
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  function getTooltip(name: string): { roi: string; count: number } {
    const stat = lookup.get(name.toLowerCase())
    if (!stat) return { roi: "N/A", count: 0 }
    return { roi: `${stat.avgROI.toFixed(1)}%`, count: stat.propertyCount }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>, name: string) => {
    const rect = (e.currentTarget.closest("svg") as SVGElement)?.getBoundingClientRect()
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 })
    }
    setHovered(name)
  }

  const boroughPaths: { name: string; d: string; labelX: number; labelY: number }[] = [
    {
      name: "Staten Island",
      d: "M93.6,191.2 L98.4,199.5 L108.8,222.2 L98.4,241.2 L80.5,258.5 L66.9,270.2 L67.2,269.9 L63.1,265.1 L63.2,266.1 L61.8,266.7 L61.2,267.8 L61.8,270.6 L50.5,277.8 L33.3,289.5 L22.7,292.6 L13.9,295.8 L2.6,298.6 L2.8,286.6 L6.9,280.0 L7.1,272.4 L5.7,270.6 L9.1,262.2 L14.2,257.4 L19.8,258.0 L23.5,255.6 L24.0,252.6 L25.7,246.7 L27.3,238.4 L28.9,232.2 L29.5,212.8 L29.5,207.6 L31.6,201.4 L38.6,194.8 L38.8,194.1 L41.2,194.9 L42.8,195.4 L44.8,195.0 L45.3,196.4 L56.4,198.2 L71.7,196.5 L87.8,192.8 L93.6,191.2 Z",
      labelX: 45.1,
      labelY: 241.1
    },
    {
      name: "Queens",
      d: "M234.9,81.9 L238.2,84.1 L241.3,84.9 L245.4,85.2 L248.7,86.2 L255.9,89.0 L261.0,89.4 L275.8,113.4 L270.3,105.9 L297.2,115.0 L275.9,198.9 L274.6,195.2 L272.6,200.9 L265.4,204.7 L262.5,209.9 L254.5,213.2 L245.7,217.3 L248.9,210.1 L236.9,182.2 L232.0,190.2 L229.7,183.0 L218.6,188.8 L213.1,183.9 L182.4,149.2 L178.4,138.1 L180.0,136.9 L162.4,125.7 L161.9,118.7 L194.5,94.3 L194.8,94.2 L195.6,95.5 L200.0,98.0 L215.2,108.7 L219.0,102.7 L219.4,95.8 L214.1,92.7 L217.0,88.1 L226.0,90.2 L230.9,86.9 L231.4,84.7 L234.6,82.4 L234.9,81.9 Z",
      labelX: 230.8,
      labelY: 130.4
    },
    {
      name: "Brooklyn",
      d: "M162.6,126.2 L176.7,141.6 L178.9,141.5 L212.0,185.4 L202.7,196.0 L196.8,190.6 L198.6,193.5 L189.4,207.5 L192.3,210.1 L194.4,215.4 L196.3,219.2 L191.7,219.7 L188.9,221.3 L182.8,221.8 L186.7,224.1 L196.8,223.0 L198.7,241.4 L188.9,234.6 L185.6,230.7 L184.6,227.8 L182.8,225.8 L180.0,224.4 L177.2,224.6 L175.7,224.8 L179.8,228.5 L182.6,231.4 L181.2,235.7 L176.4,233.5 L175.1,229.8 L178.7,236.7 L184.0,235.5 L183.3,238.1 L179.3,237.5 L167.5,237.5 L151.0,245.7 L143.6,240.6 L119.2,219.6 L135.7,180.9 L127.8,172.0 L151.2,152.0 L162.5,126.2 L162.6,126.2 Z",
      labelX: 177.7,
      labelY: 209.0
    },
    {
      name: "Manhattan",
      d: "M177.8,27.1 L179.9,29.7 L180.8,29.4 L181.6,30.0 L181.9,30.2 L184.9,29.8 L186.2,32.6 L185.5,34.4 L183.4,37.8 L181.2,40.4 L180.3,40.4 L180.8,41.3 L180.1,42.1 L176.7,49.0 L173.1,60.2 L173.7,71.5 L176.1,81.2 L170.3,93.3 L159.2,114.3 L153.8,122.7 L151.8,128.2 L152.1,130.5 L151.1,144.7 L137.4,149.4 L135.0,152.4 L131.6,154.1 L129.9,153.9 L127.8,149.1 L129.4,140.9 L132.2,128.3 L132.6,122.0 L131.9,119.8 L135.6,111.9 L140.3,103.2 L142.7,97.2 L154.1,77.7 L162.7,62.4 L167.1,50.6 L167.1,46.2 L171.3,40.4 L175.0,31.3 L177.8,27.1 Z",
      labelX: 161.5,
      labelY: 80.0
    },
    {
      name: "Bronx",
      d: "M206.6,7.9 L225.0,14.3 L253.0,30.0 L246.3,47.0 L242.0,39.4 L239.4,37.8 L236.9,45.7 L237.9,49.3 L238.9,50.0 L239.7,49.2 L238.8,51.3 L236.9,51.1 L237.8,53.1 L237.3,57.2 L238.1,60.7 L240.6,62.5 L238.5,64.3 L240.5,64.6 L243.1,68.4 L244.0,73.5 L243.3,71.5 L242.4,71.4 L245.2,76.4 L238.6,73.0 L234.0,73.7 L228.6,77.3 L224.6,72.3 L224.8,55.3 L224.6,58.0 L219.3,73.2 L219.0,76.4 L215.2,78.9 L214.0,76.2 L201.6,81.0 L195.8,78.1 L192.5,78.8 L188.7,81.5 L174.8,77.0 L179.3,45.6 L179.6,26.2 L203.8,6.9 L206.6,7.9 Z",
      labelX: 225.2,
      labelY: 57.0
    },
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading borough data…
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 overflow-hidden">
      <h3 className="mb-3 text-sm font-semibold text-foreground">NYC Borough ROI Heatmap</h3>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(0, 55%, 40%)" }} />
          Low ROI
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(60, 70%, 42%)" }} />
          Medium
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(140, 85%, 38%)" }} />
          High ROI
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(220,15%,25%)]" />
          No data
        </div>
      </div>

      <svg
        viewBox="0 0 300 300"
        className="mx-auto h-56 w-full max-w-md"
        role="img"
        aria-label="NYC Boroughs ROI Heatmap"
      >
        {/* Water background */}
        <rect x="0" y="0" width="300" height="300" rx="8" fill="hsl(210, 30%, 12%)" opacity="0.4" />

        {boroughPaths.map((bp) => {
          const isHovered = hovered === bp.name
          return (
            <g
              key={bp.name}
              onMouseMove={(e) => handleMouseMove(e, bp.name)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <path
                d={bp.d}
                fill={roiToColor(bp.name)}
                stroke={isHovered ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 40%)"}
                strokeWidth={isHovered ? 2 : 1}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-200"
              />
              <text
                x={bp.labelX}
                y={bp.labelY}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill="white"
                className="pointer-events-none select-none"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                {bp.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)" }}
        >
          <div className="font-semibold text-foreground">{hovered}</div>
          <div className="text-muted-foreground">
            Avg ROI: <span className="font-medium text-foreground">{getTooltip(hovered).roi}</span>
          </div>
          <div className="text-muted-foreground">
            Properties: <span className="font-medium text-foreground">{getTooltip(hovered).count}</span>
          </div>
        </div>
      )}
    </div>
  )
}
