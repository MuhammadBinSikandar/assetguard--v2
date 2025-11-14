"use client"
import { Suspense } from "react"
import { SignupForm } from "@/components/assetguard/signup-form"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Check } from "lucide-react"

const AnimatedBlockchain = dynamic(
  () => import("@/components/assetguard/animated-blockchain").then((m) => m.AnimatedBlockchain || (m as any).default),
  { ssr: false },
)

export default function Page() {
  return (
    <main className="min-h-[calc(100dvh)] w-full">
      <div className="grid min-h-[calc(100dvh)] w-full md:grid-cols-2">
        {/* Left branding panel */}
        <div className={cn("relative hidden md:block overflow-hidden", "bg-gradient-to-br from-sky-600 to-teal-500")}>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1px, rgba(255,255,255,0) 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0",
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-8 text-primary-foreground">
            <div>
              <h1
                className="text-balance text-4xl font-bold leading-tight md:text-5xl"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {"Join AssetGuard"}
              </h1>
              <p className="mt-3 max-w-lg text-sm/6 text-white/90">
                {"Start investing in real estate with as little as $100"}
              </p>

              {/* Testimonial */}
              <figure className="mt-8 rounded-2xl bg-black/55 p-6 shadow-lg backdrop-blur-md ring-1 ring-white/10">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <Check className="size-4 text-white" aria-hidden />
                  </span>
                  <figcaption className="text-base font-semibold text-white">{"Sarah Johnson"}</figcaption>
                </div>
                <blockquote className="text-white/90">
                  {
                    '"I\'ve invested in 5 properties through AssetGuard and seen consistent returns. The platform makes fractional real estate investment incredibly easy!"'
                  }
                </blockquote>
              </figure>
            </div>

            {/* Bottom stats */}
            <div className="mt-10 grid grid-cols-3 gap-6 text-white">
              <div>
                <div className="text-3xl font-extrabold">{"50,000+"}</div>
                <div className="text-xs text-white/80">{"Active Investors"}</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">{"$2.4B+"}</div>
                <div className="text-xs text-white/80">{"Total Value"}</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">{"95%"}</div>
                <div className="text-xs text-white/80">{"Satisfaction Rate"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="relative flex items-center justify-center px-4 py-10 md:p-8 bg-[#0b1220]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,102,255,0.10)_0%,rgba(20,184,166,0.10)_100%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md">
            <Suspense fallback={null}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
