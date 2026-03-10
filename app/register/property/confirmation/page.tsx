import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ ref?: string; wallet?: string }> }) {
  const params = await searchParams
  const ref = params.ref || "PR-2025-0001"
  const wallet = params.wallet || "9xn...D4G"
  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <span aria-hidden>✓</span>
        <span className="sr-only">Success</span>
      </div>
      <h1 className="mb-2 text-center text-3xl font-bold">Property Submitted for Verification</h1>
      <p className="mb-6 text-center text-muted-foreground">
        Our team is reviewing your documents. Once approved, the property will appear in your “My Properties” dashboard.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <Item k="Reference ID" v={ref} />
          <Item k="Wallet Address" v={wallet} />
          <Item
            k="Status"
            v={
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400" /> <span>Pending Verification</span>
              </span>
            }
          />
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register/property">Register Another Property</Link>
        </Button>
      </div>
    </main>
  )
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
  )
}
