"use client"

import type { ROIProjection } from "@/types/roi"

interface ROIBadgeProps {
  baselinePrice: number
  finalProjection: ROIProjection
  size?: "sm" | "md"
}

const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

/**
 * Color-coded ROI badge.
 * ≥ 5 % → green, 2–5 % → amber, < 2 % → red
 */
export function ROIBadge({ baselinePrice, finalProjection, size = "md" }: ROIBadgeProps) {
  const roi = finalProjection.roi_percentage
  const projectedPrice = finalProjection.projected_price
  const year = finalProjection.year

  // Colour class map
  const colorClasses =
    roi >= 5
      ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30"
      : roi >= 2
        ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30"
        : "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/30"

  const iconColor =
    roi >= 5
      ? "text-emerald-500"
      : roi >= 2
        ? "text-amber-500"
        : "text-red-500"

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tabular-nums ${colorClasses} ${sizeClasses}`}
    >
      {/* Trend arrow */}
      <svg
        className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${iconColor}`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {roi >= 0 ? (
          <path d="M3 12L8 4l5 8" />
        ) : (
          <path d="M3 4L8 12l5-8" />
        )}
      </svg>
      <span>~{roi.toFixed(1)}%</span>
      <span className="opacity-60">·</span>
      <span>{fmtCurrency.format(projectedPrice)} by {year}</span>
    </span>
  )
}

/**
 * Skeleton placeholder while ROI is loading.
 */
export function ROIBadgeSkeleton({ size = "md" }: { size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-4" : "h-5"
  return (
    <span
      className={`inline-block ${h} w-40 animate-pulse rounded-full bg-muted`}
    />
  )
}

/**
 * Fallback when ROI data can't be fetched.
 */
export function ROIBadgeFallback({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/50 font-medium text-muted-foreground ${sizeClasses}`}
    >
      <svg
        className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} opacity-50`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3M8 11h.01" />
      </svg>
      ROI unavailable
    </span>
  )
}
