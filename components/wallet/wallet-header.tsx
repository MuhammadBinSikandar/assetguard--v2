"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, QrCode, Wallet, RefreshCw, ExternalLink } from "lucide-react"

type Props = {
  onDeposit: () => void
  onWithdraw: () => void
  walletAddress?: string | null
}

export function WalletHeader({ onDeposit, onWithdraw, walletAddress }: Props) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const ownerAddress = useMemo(() => {
    if (publicKey) return publicKey.toBase58()
    return walletAddress ?? null
  }, [publicKey, walletAddress])

  const fullAddress = ownerAddress ?? ""
  const shortAddress = fullAddress ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}` : "—"

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
  const explorerClusterQuery = network === "mainnet-beta" ? "" : `?cluster=${network}`

  const fetchBalance = useCallback(async () => {
    if (!ownerAddress) { setLoading(false); return }

    let ownerPubkey: PublicKey
    try {
      ownerPubkey = new PublicKey(ownerAddress)
    } catch {
      setLoading(false)
      setBalance(null)
      return
    }

    try {
      setLoading(true)
      const lamports = await connection.getBalance(ownerPubkey)
      setBalance(lamports / LAMPORTS_PER_SOL)
    } catch (err) {
      console.error("Failed to fetch balance:", err)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [connection, ownerAddress])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const copy = async () => {
    if (!fullAddress) return
    try {
      await navigator.clipboard.writeText(fullAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { }
  }

  return (
    <Card className="overflow-hidden border-0" aria-label="Wallet total balance and actions">
      <div className="bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-6 text-white md:px-6 rounded-lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-white/90">
              <Wallet className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm">Solana Wallet</span>
              <button
                type="button"
                onClick={fetchBalance}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-xs hover:bg-white/20"
                aria-label="Refresh balance"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {loading ? (
              <Skeleton className="h-9 w-40 bg-white/20" />
            ) : (
              <div className="text-3xl font-semibold">
                {balance !== null ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL` : "—"}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{shortAddress}</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Copy wallet address"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`https://explorer.solana.com/address/${fullAddress}${explorerClusterQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>
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
