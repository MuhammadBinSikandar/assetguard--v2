import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-6">
      <div className="rounded-xl border bg-card p-6 text-center shadow-sm md:p-10">
        <h3 className="text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {"Start investing in tokenized real estate today"}
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          {"Create your free account and explore fractional ownership opportunities backed by on-chain transparency."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" className="hover:bg-accent bg-transparent">
            Explore Properties
          </Button>
        </div>
      </div>
    </section>
  )
}
