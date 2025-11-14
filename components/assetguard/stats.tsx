"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

type Stat = {
  label: string
  target: number
  prefix?: string
  suffix?: string
  icon: React.ReactNode
}

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(target * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function AnimatedValue({
  label,
  target,
  prefix,
  suffix,
}: {
  label: string
  target: number
  prefix?: string
  suffix?: string
}) {
  const val = useCounter(target)

  if (label === "Total Properties Listed") {
    const billions = (val / 1000).toFixed(1)
    return <>{`${prefix ?? ""}${billions}${suffix ?? ""}`}</>
  }

  if (label === "Average Transaction Time") {
    // Keep copy spec: "<2 hours"
    return <>{"<2 hours"}</>
  }

  return <>{`${prefix ?? ""}${val.toLocaleString()}${suffix ?? ""}`}</>
}

export function Stats() {
  const items = [
    {
      label: "Total Properties Listed",
      target: 2400, // animate to display 2.4B+
      prefix: "$",
      suffix: "B+",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 4a1 1 0 0 1 1-1h10a1 1 0 0 1 .894.553l3 6A1 1 0 0 1 18 11H5v8a1 1 0 1 1-2 0V4Z" />
        </svg>
      ),
    },
    {
      label: "Active Investors",
      target: 50000,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Zm-4 14a8 8 0 1 1 16 0H3Z" />
        </svg>
      ),
      suffix: "+",
    },
    {
      label: "Average Transaction Time",
      target: 2,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a10 10 0 1 1-7.07 2.93A10 10 0 0 1 12 2Zm1 5a1 1 0 1 0-2 0v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7Z" />
        </svg>
      ),
    },
    {
      label: "Transaction Fee Saved",
      target: 70,
      suffix: "%",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 13a8 8 0 1 1 16 0v5a1 1 0 0 1-1 1h-3v-6a4 4 0 0 0-8 0v6H5a1 1 0 0 1-1-1v-5Z" />
        </svg>
      ),
    },
  ]
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:mt-16 md:px-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border bg-card p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2">
              {it.icon}
              <div className="text-2xl font-semibold">
                <AnimatedValue label={it.label} target={it.target} prefix={it.prefix} suffix={it.suffix} />
              </div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
