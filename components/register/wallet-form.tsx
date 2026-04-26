"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react"
import Link from "next/link"

export default function WalletForm({
  value,
  onChange,
}: {
  value: string
  onChange: (address: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState(value)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWallet() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/wallet/link", { credentials: "include" })
        if (!res.ok) {
          setError("Failed to fetch wallet information.")
          return
        }
        const data = await res.json()
        if (data.walletAddress) {
          setWalletAddress(data.walletAddress)
          onChange(data.walletAddress)
        } else {
          setError("No wallet connected. Please link your Solana wallet first.")
        }
      } catch {
        setError("Failed to fetch wallet information.")
      } finally {
        setLoading(false)
      }
    }
    fetchWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Fetching your linked wallet...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-bold">Wallet Address</h2>
          <p className="text-muted-foreground mt-1">
            This wallet will receive your property-backed tokens after verification.
          </p>
        </header>
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Go to the{" "}
              <Link href="/wallet" className="text-primary underline underline-offset-2">
                Wallet page
              </Link>{" "}
              to connect your wallet, then come back here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Wallet Address</h2>
        <p className="text-muted-foreground mt-1">
          This wallet will receive your property-backed tokens after verification.
        </p>
      </header>

      <div className="max-w-xl space-y-2">
        <Label htmlFor="wallet">Connected Solana Wallet</Label>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="wallet"
            value={walletAddress}
            readOnly
            className="pl-10 bg-muted/50 cursor-default font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Wallet auto-detected from your account.</span>
        </div>
      </div>

      <Button onClick={() => onChange(walletAddress)}>
        Continue
      </Button>
    </div>
  )
}
