"use client"

import { ShieldCheck, Clock, FileText, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WelcomeStep({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">Identity Verification Required</h1>
          <p className="text-slate-300">
            We’re required to verify your identity to keep the platform secure and compliant.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2">
        <li className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-400" />
          <span className="text-slate-200">Valid government ID</span>
        </li>
        <li className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-400" />
          <span className="text-slate-200">Proof of address (if requested)</span>
        </li>
        <li className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-slate-400" />
          <span className="text-slate-200">Estimated time: 5–7 minutes</span>
        </li>
        <li className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400" />
          <span className="text-slate-200">Bank‑level encryption, data never sold</span>
        </li>
      </ul>

      <div className="mt-6">
        <Button className="w-full md:w-56" onClick={onBegin}>
          Begin Verification
        </Button>
      </div>
    </section>
  )
}
