"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2, Loader2, X } from "lucide-react"

type BuyFractionsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: {
    id: string
    title: string
    image?: string
    agPricePerFractionUSD: number // Price per fraction in USD (AG token reference)
    availableFractions: number
    totalFractions: number
    roi: number
  }
  walletBalanceSol: number
  conversion: {
    solUsd: number // e.g., 150 USD per SOL
  }
}

type Step = 1 | 2 | 3 | 4 | 5

function formatUSD(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
}

function formatSOL(n: number) {
  return `${n.toFixed(4)} SOL`
}

function formatAG(n: number) {
  return `${n.toFixed(2)} AG`
}

export function BuyFractionsModal({
  open,
  onOpenChange,
  property,
  walletBalanceSol,
  conversion,
}: BuyFractionsModalProps) {
  const [step, setStep] = useState<Step>(1)

  // Step 1/2 shared inputs
  const [amountSol, setAmountSol] = useState<number>(0) // user enters SOL
  const minSol = 0.1
  const maxSol = Math.max(0.1, walletBalanceSol) // soft cap based on wallet

  // Derived values
  const amountUSD = useMemo(() => amountSol * conversion.solUsd, [amountSol, conversion.solUsd])
  const fractionsAG = useMemo(() => {
    if (property.agPricePerFractionUSD <= 0) return 0
    return amountUSD / property.agPricePerFractionUSD
  }, [amountUSD, property.agPricePerFractionUSD])

  const expectedReturnUSD = useMemo(() => (amountUSD * property.roi) / 100, [amountUSD, property.roi])

  // Step 4 processing
  const [processingPct, setProcessingPct] = useState(0)
  const [processingIndex, setProcessingIndex] = useState(0)
  const processingSteps = [
    "Processing payment in Solana...",
    "Executing smart contract on Solana...",
    "Minting AG tokens...",
  ]
  const [txHash, setTxHash] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Reset when opened
      setStep(1)
      setAmountSol(0)
      setProcessingPct(0)
      setProcessingIndex(0)
      setTxHash(null)
    }
  }, [open])

  useEffect(() => {
    if (step !== 4) return
    let pct = 0
    let idx = 0
    setProcessingPct(0)
    setProcessingIndex(0)

    const interval = setInterval(() => {
      pct += 10
      if (pct >= 100) {
        clearInterval(interval)
        // Fake tx hash
        const hash = "5X7NQ2xZCgXx5xqJc1yT8fLkF3bR9z2aEdv3s1tUoYpKqLmNoP"
        setTxHash(hash)
        setStep(5)
        return
      }
      // Advance human-readable step stage every ~33%
      if (pct >= 66) idx = 2
      else if (pct >= 33) idx = 1
      else idx = 0
      setProcessingIndex(idx)
      setProcessingPct(pct)
    }, 350)

    return () => clearInterval(interval)
  }, [step])

  const pctComplete = useMemo<0 | 25 | 50 | 75 | 100>(() => {
    switch (step) {
      case 1:
        return 25
      case 2:
        return 50
      case 3:
        return 75
      case 4:
      case 5:
        return 100
      default:
        return 25
    }
  }, [step])

  const canContinueFromStep1 = amountSol >= minSol
  const canContinueFromStep2 = amountSol > 0 && amountSol <= walletBalanceSol

  // Step 3 – risk confirmation
  const [agreed, setAgreed] = useState(false)
  const canConfirm = agreed && amountSol > 0 && fractionsAG > 0

  const onConfirmPay = () => {
    setStep(4)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Buy Property Fractions</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Step {step} of 5 •{" "}
            {["Investment Details", "Payment", "Review & Confirm", "Processing", "Success"][step - 1]}
          </div>
          <Progress value={pctComplete} />
        </div>

        {step === 1 && (
          <StepInvestmentDetails
            property={property}
            minSol={minSol}
            maxSol={maxSol}
            amountSol={amountSol}
            setAmountSol={setAmountSol}
            amountUSD={amountUSD}
            fractionsAG={fractionsAG}
            expectedReturnUSD={expectedReturnUSD}
            onContinue={() => setStep(2)}
            canContinue={canContinueFromStep1}
          />
        )}

        {step === 2 && (
          <StepPayment
            walletBalanceSol={walletBalanceSol}
            amountSol={amountSol}
            setAmountSol={setAmountSol}
            conversion={conversion}
            agPriceUSD={property.agPricePerFractionUSD}
            fractionsAG={fractionsAG}
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
            canContinue={canContinueFromStep2}
          />
        )}

        {step === 3 && (
          <StepReviewConfirm
            property={property}
            amountSol={amountSol}
            amountUSD={amountUSD}
            fractionsAG={fractionsAG}
            conversion={conversion}
            agreed={agreed}
            setAgreed={(v) => setAgreed(Boolean(v))}
            onConfirm={onConfirmPay}
            onBack={() => setStep(2)}
            onCancel={() => onOpenChange(false)}
            canConfirm={canConfirm}
          />
        )}

        {step === 4 && <StepProcessing processingPct={processingPct} currentLabel={processingSteps[processingIndex]} />}

        {step === 5 && txHash && (
          <StepSuccess
            propertyTitle={property.title}
            amountSol={amountSol}
            fractionsAG={fractionsAG}
            txHash={txHash}
            onClose={() => onOpenChange(false)}
          />
        )}

        {/* Top-right close button for easy dismissal */}
        <DialogClose asChild>
          <button
            aria-label="Close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function StepInvestmentDetails({
  property,
  minSol,
  maxSol,
  amountSol,
  setAmountSol,
  amountUSD,
  fractionsAG,
  expectedReturnUSD,
  onContinue,
  canContinue,
}: {
  property: BuyFractionsModalProps["property"]
  minSol: number
  maxSol: number
  amountSol: number
  setAmountSol: (v: number) => void
  amountUSD: number
  fractionsAG: number
  expectedReturnUSD: number
  onContinue: () => void
  canContinue: boolean
}) {
  const availablePct = Math.max(
    0,
    Math.min(100, Math.round((property.availableFractions / property.totalFractions) * 100)),
  )

  return (
    <div className="space-y-5">
      {/* Property summary card */}
      <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row">
        <img
          src={property.image || "/placeholder.svg?height=80&width=120&query=property%20image"}
          width={120}
          height={80}
          alt="Property cover"
          className="h-20 w-32 rounded object-cover"
        />
        <div className="flex-1 space-y-1">
          <div className="text-sm font-medium">{property.title}</div>
          <div className="text-xs text-muted-foreground">
            AG price per fraction: {formatUSD(property.agPricePerFractionUSD)}{" "}
            <span className="text-muted-foreground/70">
              (≈ {property.agPricePerFractionUSD.toFixed(2)} AG at $1.00/AG)
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span>Available fractions</span>
              <span className="tabular-nums">
                {property.availableFractions}/{property.totalFractions} ({availablePct}%)
              </span>
            </div>
            <Progress value={availablePct} />
          </div>
        </div>
      </div>

      {/* Investment amount */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="amount-sol">Investment Amount (SOL)</Label>
          <Input
            id="amount-sol"
            inputMode="decimal"
            placeholder="0.0000"
            value={Number.isNaN(amountSol) ? "" : amountSol}
            onChange={(e) => setAmountSol(Math.max(0, Number(e.target.value)))}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Min: {formatSOL(minSol)} • Max: {formatSOL(maxSol)}
            </span>
            <button type="button" className="hover:text-foreground underline" onClick={() => setAmountSol(maxSol)}>
              Max
            </button>
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm">
          <div className="mb-2 font-medium">Auto-calculated</div>
          <div className="flex items-center justify-between">
            <span>Amount (USD)</span>
            <span className="tabular-nums">{formatUSD(amountUSD)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fractions (AG)</span>
            <span className="tabular-nums">{formatAG(fractionsAG)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Expected Return</span>
            <span className="text-emerald-600 tabular-nums">+{formatUSD(expectedReturnUSD)}</span>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={onContinue} disabled={!canContinue}>
        Continue
      </Button>
    </div>
  )
}

function StepPayment({
  walletBalanceSol,
  amountSol,
  setAmountSol,
  conversion,
  agPriceUSD,
  fractionsAG,
  onContinue,
  onBack,
  canContinue,
}: {
  walletBalanceSol: number
  amountSol: number
  setAmountSol: (v: number) => void
  conversion: { solUsd: number }
  agPriceUSD: number
  fractionsAG: number
  onContinue: () => void
  onBack: () => void
  canContinue: boolean
}) {
  const amountUSD = amountSol * conversion.solUsd

  return (
    <div className="space-y-5">
      <div className="rounded-md border p-3">
        <div className="text-sm font-medium">Payment Method</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Solana (SOL)</div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pay-amount">Amount (SOL)</Label>
            <Input
              id="pay-amount"
              inputMode="decimal"
              placeholder="0.0000"
              value={Number.isNaN(amountSol) ? "" : amountSol}
              onChange={(e) => setAmountSol(Math.max(0, Number(e.target.value)))}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Your Wallet: {formatSOL(walletBalanceSol)}</span>
              <button
                type="button"
                className="hover:text-foreground underline"
                onClick={() => setAmountSol(walletBalanceSol)}
              >
                Use Max
              </button>
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Conversion</span>
              <span className="tabular-nums">
                {formatSOL(amountSol)} → {formatAG(fractionsAG)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate</span>
              <span className="tabular-nums">1 SOL ≈ {formatUSD(conversion.solUsd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AG per fraction</span>
              <span className="tabular-nums">{formatUSD(agPriceUSD)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Amount (USD)</span>
              <span className="tabular-nums">{formatUSD(amountUSD)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack} className="w-1/3 bg-transparent">
          Back
        </Button>
        <Button onClick={onContinue} className="w-2/3" disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function StepReviewConfirm({
  property,
  amountSol,
  amountUSD,
  fractionsAG,
  conversion,
  agreed,
  setAgreed,
  onConfirm,
  onBack,
  onCancel,
  canConfirm,
}: {
  property: BuyFractionsModalProps["property"]
  amountSol: number
  amountUSD: number
  fractionsAG: number
  conversion: { solUsd: number }
  agreed: boolean
  setAgreed: (v: boolean) => void
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
  canConfirm: boolean
}) {
  const platformFeeUSD = Math.max(1, amountUSD * 0.005) // 0.5% example
  const totalUSD = amountUSD + platformFeeUSD

  return (
    <div className="space-y-5">
      <div className="rounded-md border">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="border-b p-3 sm:border-b-0 sm:border-r">
            <div className="text-sm font-medium">Property</div>
            <div className="text-sm text-muted-foreground">{property.title}</div>
          </div>
          <div className="border-b p-3 sm:border-b-0">
            <div className="text-sm font-medium">Fractions Purchased</div>
            <div className="text-sm tabular-nums">{formatAG(fractionsAG)}</div>
          </div>
          <div className="border-b p-3 sm:border-b-0 sm:border-r">
            <div className="text-sm font-medium">Amount</div>
            <div className="text-sm tabular-nums">
              {formatSOL(amountSol)} ({formatUSD(amountUSD)})
            </div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium">Platform Fee</div>
            <div className="text-sm tabular-nums">{formatUSD(platformFeeUSD)}</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t p-3 text-sm font-medium">
          <span>Total Cost</span>
          <span className="tabular-nums">
            {formatUSD(totalUSD)} ({formatSOL(totalUSD / conversion.solUsd)})
          </span>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="escrow">
          <AccordionTrigger>Escrow Terms</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            Funds are held in program-controlled escrow until mint is finalized and recorded on-chain. In the event of a
            failure, your SOL is returned automatically by the program.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="contract">
          <AccordionTrigger>Smart Contract Details</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            The mint and escrow are executed by an audited Solana program. Transaction references and program IDs will
            be attached to your receipt. You can verify the mint on-chain via the Solana explorer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center gap-2">
        <Checkbox id="risk" checked={agreed} onCheckedChange={(v) => setAgreed(Boolean(v))} />
        <Label htmlFor="risk" className="text-sm text-muted-foreground">
          I understand the risks of crypto assets, potential loss of principal, and agree to the platform terms.
        </Label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack} className="w-1/3 bg-transparent">
          Back
        </Button>
        <div className="flex gap-2 w-2/3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={!canConfirm}>
            Confirm & Pay
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepProcessing({ processingPct, currentLabel }: { processingPct: number; currentLabel: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">{currentLabel}</span>
      </div>
      <Progress value={processingPct} />
      <div className="text-center text-xs text-muted-foreground">
        This may take up to 30 seconds depending on network conditions.
      </div>
    </div>
  )
}

function StepSuccess({
  propertyTitle,
  amountSol,
  fractionsAG,
  txHash,
  onClose,
}: {
  propertyTitle: string
  amountSol: number
  fractionsAG: number
  txHash: string
  onClose: () => void
}) {
  const explorerUrl = `https://explorer.solana.com/tx/${encodeURIComponent(txHash)}?cluster=mainnet`

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(txHash)
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <div className="text-xl font-semibold">Investment Successful!</div>
      </div>

      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Property</span>
          <span className="font-medium">{propertyTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Amount Paid</span>
          <span className="tabular-nums">{formatSOL(amountSol)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>AG Tokens Received</span>
          <span className="tabular-nums">{formatAG(fractionsAG)}</span>
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span>Transaction Hash</span>
            <span className="font-mono text-xs">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={copyHash}>
              Copy
            </Button>
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                View on Solana Explorer
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={onClose}>
          View in Portfolio
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
          Invest in More Properties
        </Button>
      </div>
    </div>
  )
}
