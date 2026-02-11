"use client"

import { useEffect, useState } from "react"
import { KycWizard } from "@/components/kyc/kyc-wizard"
import { PendingStep } from "@/components/kyc/steps/pending-step"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store/redux/store"

export default function KycPage() {
  const router = useRouter()
  const user = useAppSelector((state) => state.user.user)
  const authLoading = useAppSelector((state) => state.user.loading)
  const initialFetchDone = useAppSelector((state) => state.user._initialFetchDone)

  // Derive kycStatus from Redux user state (already populated by KYCPromptProvider's useAuth)
  const kycStatus = user?.kycStatus ?? "IDLE"
  const loading = authLoading || !initialFetchDone

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    )
  }

  // Already approved
  if (kycStatus === "APPROVED") {
    return (
      <main className="min-h-[100svh] bg-slate-950 text-slate-100">
        <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold">Identity Verified</h2>
              <p className="mt-2 text-slate-300">
                Your KYC has been approved. You have full access to the platform.
              </p>
              <Button className="mt-6 w-48" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Pending review
  if (kycStatus === "PENDING") {
    return (
      <main className="min-h-[100svh] bg-slate-950 text-slate-100">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-4 md:p-6">
              <PendingStep />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // IDLE or REJECTED — show the wizard
  return (
    <main className="min-h-[100svh] bg-slate-950 text-slate-100">
      <KycWizard />
    </main>
  )
}
