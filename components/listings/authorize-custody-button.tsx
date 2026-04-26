"use client"

import { useCallback, useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { PublicKey, Transaction } from "@solana/web3.js"
import {
    TOKEN_2022_PROGRAM_ID,
    createApproveInstruction,
    getAssociatedTokenAddressSync,
    getMint,
} from "@solana/spl-token"
import { Button } from "@/components/ui/button"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type MeWallet = { success?: boolean; data?: { user?: { walletAddress?: string | null } } }

/**
 * One-chain tx: set Token-2022 delegate to the platform admin for `wholeTokens` (whole units of the mint).
 * Seller’s connected wallet must match the profile `walletAddress`.
 */
export function AuthorizeCustodyButton({
    mintAddress,
    wholeTokens,
    onSuccess,
    className,
    size = "sm",
    label = "Authorize sales",
    variant = "default",
    disabled: disabledProp = false,
}: {
    mintAddress: string
    wholeTokens: number
    onSuccess?: () => void
    className?: string
    size?: "default" | "sm" | "lg"
    label?: string
    variant?: "default" | "secondary" | "outline"
    disabled?: boolean
}) {
    const { connection } = useConnection()
    const { publicKey, sendTransaction, connected, connecting } = useWallet()
    const { setVisible } = useWalletModal()
    const { toast } = useToast()
    const [busy, setBusy] = useState(false)

    const run = useCallback(async () => {
        if (!Number.isInteger(wholeTokens) || wholeTokens < 1) {
            toast({
                title: "Invalid amount",
                description: "Token amount must be a positive whole number.",
                variant: "destructive",
            })
            return
        }
        if (!connected || !publicKey) {
            setVisible(true)
            return
        }
        setBusy(true)
        try {
            const me = (await fetch("/api/auth/me", { credentials: "include" }).then((r) =>
                r.json(),
            )) as MeWallet
            const expected = me.data?.user?.walletAddress?.trim()
            if (!expected) {
                toast({
                    title: "Wallet not on profile",
                    description: "Link and save a wallet in your account before authorizing sales.",
                    variant: "destructive",
                })
                return
            }
            if (publicKey.toBase58() !== expected) {
                toast({
                    title: "Wrong wallet",
                    description: "Connect the same wallet you saved on your profile as the property seller.",
                    variant: "destructive",
                })
                return
            }

            const escrow = await fetch("/api/escrow-wallet", { credentials: "include" }).then((r) =>
                r.json(),
            )
            if (!escrow.success || typeof escrow.address !== "string") {
                toast({
                    title: "Server misconfigured",
                    description: "Escrow address is not available.",
                    variant: "destructive",
                })
                return
            }

            const mint = new PublicKey(mintAddress)
            const admin = new PublicKey(escrow.address)
            const sellerAta = getAssociatedTokenAddressSync(mint, publicKey, false, TOKEN_2022_PROGRAM_ID)
            const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID)
            const { decimals } = mintInfo
            const amount = BigInt(wholeTokens) * BigInt(10 ** decimals)

            const ix = createApproveInstruction(
                sellerAta,
                admin,
                publicKey,
                amount,
                [],
                TOKEN_2022_PROGRAM_ID,
            )
            const tx = new Transaction().add(ix)
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
            tx.recentBlockhash = blockhash
            tx.feePayer = publicKey
            const sig = await sendTransaction(tx, connection, { maxRetries: 3 })
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature: sig }, "confirmed")

            toast({ title: "Authorization confirmed", description: "Buyers can now receive tokens for this amount." })
            onSuccess?.()
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Transaction failed."
            toast({ title: "Authorization failed", description: msg, variant: "destructive" })
        } finally {
            setBusy(false)
        }
    }, [
        wholeTokens,
        connected,
        publicKey,
        connection,
        sendTransaction,
        setVisible,
        toast,
        mintAddress,
        onSuccess,
        disabledProp,
    ])

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            className={cn("gap-1.5", className)}
            disabled={disabledProp || busy || connecting}
            onClick={() => void run()}
        >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
            {label}
        </Button>
    )
}
