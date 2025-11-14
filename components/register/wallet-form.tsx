"use client"

import { useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function isBase58Address(addr: string) {
  // Basic Solana address check: base58 set excluding 0OIl; 32-44 chars
  const re = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return re.test(addr)
}

export default function WalletForm({
  value,
  onChange,
}: {
  value: string
  onChange: (address: string) => void
}) {
  const [local, setLocal] = useState(value)
  const valid = useMemo(() => isBase58Address(local), [local])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Enter Your Wallet Address</h2>
        <p className="text-muted-foreground mt-1">
          This wallet will receive your property-backed tokens after verification.
        </p>
      </header>

      <div className="max-w-xl space-y-2">
        <Label htmlFor="wallet">Phantom Wallet Address</Label>
        <Input
          id="wallet"
          value={local}
          onChange={(e) => setLocal(e.target.value.trim())}
          placeholder="Enter your Solana address"
          aria-invalid={!valid && local.length > 0}
          aria-describedby="wallet-hint"
        />
        <span id="wallet-hint" className="text-xs text-muted-foreground">
          Must be a valid Solana base58 address (32–44 chars).
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => onChange(local)} disabled={!valid}>
          Save & Continue
        </Button>
        {!valid && local.length > 0 && <span className="text-sm text-destructive">Invalid Solana address</span>}
      </div>
    </div>
  )
}
