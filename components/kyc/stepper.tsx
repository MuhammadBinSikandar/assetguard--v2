import type React from "react"
// Shared top progress + step indicators
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = { label: string; icon: React.ComponentType<{ className?: string }> }
export function Stepper({ steps, currentIndex }: { steps: ReadonlyArray<Step>; currentIndex: number }) {
  const pct = (currentIndex / (steps.length - 1)) * 100
  return (
    <div>
      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-slate-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const completed = i < currentIndex
          const active = i === currentIndex
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm",
                  completed
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : active
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-900 text-slate-400",
                )}
              >
                {completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn("text-sm", active ? "text-white" : "text-slate-400")}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
