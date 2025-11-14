import { Button } from "@/components/ui/button"
import { AnimatedBlockchain } from "./animated-blockchain"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative flex min-h-[100vh] items-center pt-28 md:pt-32">
      <AnimatedBlockchain />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,102,255,0.10)_0%,rgba(20,184,166,0.10)_100%)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h1 className="text-balance text-5xl md:text-6xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {"Tokenize Real Estate. Invest with $100"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {"Blockchain-powered fractional property ownership with AI-driven insights"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button variant="outline" className="hover:bg-accent bg-transparent">
                Explore Properties
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-xl border bg-card p-4 shadow-sm md:p-6">
              <div className="rounded-lg border bg-background p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-primary">$100</div>
                    <div className="text-sm text-muted-foreground">Min. Ticket</div>
                  </div>
                  <div>
                    <div
                      className="text-2xl font-semibold text-secondary-foreground"
                      style={{ color: "var(--secondary)" }}
                    >
                      On-chain
                    </div>
                    <div className="text-sm text-muted-foreground">24/7</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">KYC</div>
                    <div className="text-sm text-muted-foreground">Compliant</div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {"Live demo showcasing tokenized property metrics and blockchain settlement lattice."}
              </p>
            </div>
            <div className="pointer-events-none absolute -left-6 -top-8 hidden select-none md:block">
              <div className="rounded-xl border border-white/20 bg-white/30 p-4 backdrop-blur-md shadow-sm dark:bg-white/5 dark:border-white/10">
                <div className="text-sm font-semibold text-primary">$420k</div>
                <div className="text-xs text-muted-foreground">Yield 6.8% • NYC</div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 top-16 hidden select-none md:block">
              <div className="rounded-xl border border-white/20 bg-white/30 p-4 backdrop-blur-md shadow-sm dark:bg-white/5 dark:border-white/10">
                <div className="text-sm font-semibold" style={{ color: "var(--secondary)" }}>
                  Verified
                </div>
                <div className="text-xs text-muted-foreground">On-chain title</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
