"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"
import { Loader2, CheckCircle2, Radio } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DEVNET = "devnet"

function fmtSol(n: number) {
  return `${n.toFixed(6)} SOL`
}

function txExplorerUrl(sig: string) {
  return `https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=${DEVNET}`
}

type BuyTokensModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  propertyTitle: string
  referenceId: string
  pricePerTokenUsd: number
  tokensMax: number
  totalFractions: number
}

type Phase = "idle" | "signing" | "processing" | "done" | "error"

export function BuyTokensModal({
  open,
  onOpenChange,
  listingId,
  propertyTitle,
  referenceId,
  pricePerTokenUsd,
  tokensMax,
  totalFractions,
}: BuyTokensModalProps) {
  const { toast } = useToast()
  const { publicKey, sendTransaction, connected, connecting } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const inputId = useId()

  const [tokens, setTokens] = useState(1)
  const [solUsd, setSolUsd] = useState<number | null>(null)
  const [escrow, setEscrow] = useState<string | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [tokenTx, setTokenTx] = useState<string | null>(null)
  const [paymentTx, setPaymentTx] = useState<string | null>(null)
  const [serverPayload, setServerPayload] = useState<Record<string, unknown> | null>(null)
  const [readiness, setReadiness] = useState<{
    custodyOk: boolean
    reason?: string
    totalSolEstimate?: number
  } | null>(null)
  const [readinessLoading, setReadinessLoading] = useState(false)

  const fetchSol = useCallback(async () => {
    setLoadingPrice(true)
    try {
      const r = await fetch("/api/sol-price")
      const j = await r.json()
      if (j.success && typeof j.priceUsd === "number") {
        setSolUsd(j.priceUsd)
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingPrice(false)
    }
  }, [])

  const fetchEscrow = useCallback(async () => {
    try {
      const r = await fetch("/api/escrow-wallet")
      const j = await r.json()
      if (j.success && typeof j.address === "string") {
        setEscrow(j.address)
      }
    } catch {
      setEscrow(null)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setPhase("idle")
      setErrMsg(null)
      setTokenTx(null)
      setPaymentTx(null)
      setServerPayload(null)
      setTokens(1)
      setReadiness(null)
      return
    }
    void fetchSol()
    void fetchEscrow()
  }, [open, fetchSol, fetchEscrow])

  useEffect(() => {
    if (!open) return
    const t = setInterval(() => {
      void fetchSol()
    }, 30_000)
    return () => clearInterval(t)
  }, [open, fetchSol])

  const validTokens = useMemo(() => {
    if (!Number.isInteger(tokens) || tokens < 1) return false
    return tokens <= tokensMax
  }, [tokens, tokensMax])

  useEffect(() => {
    if (!open || !validTokens) {
      setReadiness(null)
      return
    }
    const ac = new AbortController()
    setReadinessLoading(true)
    void (async () => {
      try {
        const r = await fetch(
          `/api/listings/${encodeURIComponent(listingId)}/purchase-readiness?tokensToBuy=${tokens}`,
          { credentials: "include", signal: ac.signal },
        )
        const j = (await r.json()) as {
          success?: boolean
          data?: { custodyOk?: boolean; reason?: string; totalSolEstimate?: number }
        }
        if (ac.signal.aborted) return
        if (j.success && j.data) {
          setReadiness({
            custodyOk: j.data.custodyOk === true,
            reason: j.data.reason,
            totalSolEstimate: j.data.totalSolEstimate,
          })
        } else {
          setReadiness({ custodyOk: false, reason: "CHECK_FAILED" })
        }
      } catch {
        if (!ac.signal.aborted) setReadiness({ custodyOk: false, reason: "NETWORK" })
      } finally {
        if (!ac.signal.aborted) setReadinessLoading(false)
      }
    })()
    return () => ac.abort()
  }, [open, validTokens, tokens, listingId])

  const usdSubtotal = useMemo(() => (validTokens ? tokens * pricePerTokenUsd : 0), [validTokens, tokens, pricePerTokenUsd])

  const { totalSol, platformFee, totalRequired } = useMemo(() => {
    if (!solUsd || !validTokens) return { totalSol: 0, platformFee: 0, totalRequired: 0 }
    const subSol = (tokens * pricePerTokenUsd) / solUsd
    const fee = subSol * 0.005
    return { totalSol: subSol, platformFee: fee, totalRequired: subSol }
  }, [tokens, pricePerTokenUsd, solUsd, validTokens])

  const onPay = async () => {
    setErrMsg(null)
    if (!escrow) {
      toast({ title: "Configuration error", description: "Escrow address unavailable.", variant: "destructive" })
      return
    }
    if (!validTokens) {
      toast({ title: "Invalid amount", description: "Enter a valid number of tokens.", variant: "destructive" })
      return
    }
    if (!publicKey || !connected) {
      setVisible(true)
      return
    }
    if (!solUsd) {
      toast({ title: "Price loading", description: "Wait for the SOL price, then try again.", variant: "destructive" })
      return
    }
    if (readiness && !readiness.custodyOk) {
      toast({
        title: "Sale is not ready",
        description:
          "Tokens cannot be delivered yet (custody or listing). Do not pay — ask the seller to fix the listing, or use a mint with platform custody.",
        variant: "destructive",
      })
      return
    }
    if (readinessLoading) {
      toast({ title: "Please wait", description: "Checking that the purchase can complete…", variant: "destructive" })
      return
    }
    setPhase("signing")
    try {
      const lamports = BigInt(Math.round(totalRequired * Number(LAMPORTS_PER_SOL)))
      const to = new PublicKey(escrow)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
      const t = new Transaction()
      t.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: to,
          lamports: Number(lamports),
        }),
      )
      t.recentBlockhash = blockhash
      t.feePayer = publicKey
      const sig = await sendTransaction(t, connection)
      setPaymentTx(sig)
      setPhase("processing")
      await connection.confirmTransaction(
        { blockhash, lastValidBlockHeight, signature: sig },
        "confirmed",
      )
      const res = await fetch(`/api/listings/${listingId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tokensToBuy: tokens,
          buyerWallet: publicKey.toBase58(),
          solTransferTxHash: sig,
          expectedTotalSol: totalRequired,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        message?: string
        refundTx?: string
        code?: string
      }
      if (!res.ok) {
        const extra =
          typeof json.refundTx === "string"
            ? ` Refund transaction: ${json.refundTx}`
            : ""
        const detail = (json.message || res.statusText || "Purchase failed on the server.") + extra
        throw new Error(detail)
      }
      setServerPayload((json.data as Record<string, unknown> | null) ?? null)
      const tok = (json.data as { tokenTransferTxHash?: string })?.tokenTransferTxHash
      if (typeof tok === "string") setTokenTx(tok)
      setPhase("done")
      toast({ title: "Purchase complete", description: "Tokens and SOL payout were processed." })
    } catch (e) {
      const m = e instanceof Error ? e.message : "Transaction failed"
      setErrMsg(m)
      setPhase("error")
      toast({ title: "Payment failed", description: m, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Buy tokens</DialogTitle>
          <DialogDescription className="text-left text-sm">
            {propertyTitle} · <span className="font-mono">{referenceId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Price / token (USD)</span>
            <span className="font-medium text-foreground">
              {pricePerTokenUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Offer size</span>
            <span>
              {tokensMax.toLocaleString()} / {totalFractions.toLocaleString()} available
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId}>Number of tokens to buy</Label>
            <Input
              id={inputId}
              inputMode="numeric"
              type="number"
              min={1}
              max={tokensMax}
              value={Number.isNaN(tokens) ? "" : tokens}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setTokens(Number.isNaN(v) ? 1 : v)
              }}
            />
            <p className="text-xs text-muted-foreground">Max {tokensMax.toLocaleString()} (remaining on listing)</p>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {validTokens
                  ? `${tokens} × ${pricePerTokenUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })} = ${usdSubtotal.toFixed(2)}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>≈ in SOL</span>
              {solUsd != null && validTokens ? (
                <span className="inline-flex items-center gap-1.5">
                  {fmtSol(totalRequired)}
                  <Badge variant="secondary" className="h-5 gap-1 font-normal text-[10px]">
                    <Radio className="h-3 w-3" />
                    Live
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">{loadingPrice ? "…" : "—"}</span>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Platform fee (0.5%)</span>
              <span>{validTokens && solUsd != null ? fmtSol(platformFee) : "—"}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1.5 mt-1.5">
              <span>Total SOL to send</span>
              <span>{validTokens && solUsd != null ? fmtSol(totalRequired) : "—"}</span>
            </div>
            {solUsd != null && (
              <p className="text-[10px] text-muted-foreground">Using 1 SOL ≈ ${solUsd.toFixed(2)} USD (refreshed every 30s while open)</p>
            )}
          </div>

          {readinessLoading && validTokens && (
            <p className="text-xs text-muted-foreground">Checking on-chain sale readiness…</p>
          )}
          {!readinessLoading && readiness && !readiness.custodyOk && validTokens && (
            <p className="text-sm text-amber-700 dark:text-amber-200 rounded-md border border-amber-200/80 bg-amber-500/10 px-3 py-2">
              This purchase cannot be settled on-chain right now (tokens are not in delegate or platform custody for this
              amount). Do not pay — the seller or platform must fix custody first. If you already sent SOL, the server
              will attempt a refund when the purchase cannot complete.
            </p>
          )}

          {errMsg && phase === "error" && (
            <p className="text-sm text-destructive">{errMsg}</p>
          )}

          {phase === "done" && serverPayload != null && (
            <div className="rounded-md border border-emerald-200 bg-emerald-500/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Purchase recorded
              </div>
              {paymentTx && (
                <a
                  className="mt-2 block text-xs text-primary underline break-all"
                  href={txExplorerUrl(paymentTx)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Your SOL payment: {paymentTx}
                </a>
              )}
              {tokenTx && (
                <a
                  className="mt-1 block text-xs text-primary underline break-all"
                  href={txExplorerUrl(tokenTx)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Token transfer: {tokenTx}
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={
                !validTokens ||
                !solUsd ||
                !escrow ||
                readinessLoading ||
                (readiness != null && !readiness.custodyOk) ||
                phase === "signing" ||
                phase === "processing" ||
                phase === "done" ||
                connecting
              }
              onClick={() => void onPay()}
            >
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!connected && "Connect & pay"}
              {connected && phase === "idle" && "Connect & pay"}
              {connected && phase === "signing" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for wallet signature…
                </>
              )}
              {connected && phase === "processing" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing & transferring tokens…
                </>
              )}
              {connected && phase === "done" && "Done"}
              {connected && phase === "error" && "Retry"}
            </Button>
            {!connected && (
              <Button type="button" variant="outline" onClick={() => setVisible(true)}>
                Connect wallet
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
