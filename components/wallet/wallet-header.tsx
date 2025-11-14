"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, QrCode, Wallet } from "lucide-react"
import { useState } from "react"

type Props = {
  onDeposit: () => void
  onWithdraw: () => void
}

export function WalletHeader({ onDeposit, onWithdraw }: Props) {
  const [copied, setCopied] = useState(false)
  const address = "0x12A4...9FdC"

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("0x12A4cE5B9d7F21eC83aFbe2392bB7F0b9c329FdC")
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <Card className="overflow-hidden border-0" aria-label="Wallet total balance and actions">
      <div className="bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-6 text-white md:px-6 rounded-lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-white/90">
              <Wallet className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm">Wallet</span>
            </div>
            <div className="text-3xl font-semibold">$24,530.42</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{address}</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Copy wallet address"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Show wallet QR code"
              >
                <QrCode className="h-3.5 w-3.5" />
                QR
              </button>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button className="w-full sm:w-auto" variant="secondary" onClick={onDeposit}>
              Deposit
            </Button>
            <Button
              variant="outline"
              className="w-full bg-white/10 text-white hover:bg-white/20 sm:w-auto"
              onClick={onWithdraw}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
