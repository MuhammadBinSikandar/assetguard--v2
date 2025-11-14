import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export function PendingStep() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-semibold">Verification Submitted</h2>
      <p className="mx-auto mt-2 max-w-2xl text-slate-300">
        We&apos;re reviewing your documents. This typically takes 24–48 hours. You&apos;ll receive a notification when
        your account is verified.
      </p>

      <div className="mx-auto mt-6 grid max-w-md gap-3 text-left">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-medium text-slate-200">What happens next</h3>
          <ol className="mt-2 space-y-2 text-sm text-slate-300">
            <li>1. Our team confirms your identity documents</li>
            <li>2. Automated checks complete within 24–48 hours</li>
            <li>3. We notify you via email upon completion</li>
          </ol>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button className="w-48">Return to Dashboard</Button>
        <a href="/support" className="text-sm text-blue-400 underline-offset-4 hover:underline">
          Contact Support
        </a>
      </div>
    </section>
  )
}
