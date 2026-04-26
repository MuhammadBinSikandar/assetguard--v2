"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store/redux/store"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopBar } from "@/components/admin/admin-topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
    Loader2,
    Copy,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from "lucide-react"
import { PurchaseStatus } from "@prisma/client"
import { solanaTxExplorerUrl } from "@/lib/solana/explorer"

type WalletInfo = {
    publicKey: string
    balanceLamports: string
    balanceSol: number
    balanceUsd: number
    solPriceUsd: number
    network: string
}

type CustodyStats = {
    totalPending: number
    totalEscrowReceived: number
    totalCompleted: number
    totalFailed: number
    totalSolHeld: number
    totalPlatformFeesCollected: number
    totalVolumeSol: number
}

type PurchaseRow = {
    id: string
    createdAt: string
    status: PurchaseStatus
    tokensBought: number
    totalSolPaid: number
    platformFeeSol: number
    sellerReceivedSol: number
    solPriceUsdAtPurchase: number
    solTransferTxHash: string | null
    tokenTransferTxHash: string | null
    solReleaseTxHash: string | null
    refundTxHash: string | null
    property: { referenceId: string; borough: string; block: string; lot: string }
    buyer: { name: string | null; email: string | null; walletAddress: string | null }
    seller: { name: string | null; email: string | null; walletAddress: string | null }
}

type ReadinessIssue = {
    listingId: string
    propertyReferenceId: string
    sellerName: string | null
    sellerEmail: string | null
    sellerWallet: string
    tokensRemaining: number
    tokensInCustodyWhole: number
    gap: number
}

function shortHash(h: string, left = 6, right = 4) {
    if (h.length <= left + right) return h
    return `${h.slice(0, left)}…${h.slice(-right)}`
}

function TruncLink({ hash, label }: { hash: string; label?: string }) {
    const u = solanaTxExplorerUrl(hash, "devnet")
    return (
        <a
            href={u}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-0.5"
        >
            {label ?? shortHash(hash)}
            <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
    )
}

function statusBadge(s: PurchaseStatus) {
    const map: Record<PurchaseStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> =
    {
        PENDING: { variant: "secondary", label: "Pending" },
        ESCROW_RECEIVED: { variant: "default", label: "Escrow received" },
        COMPLETED: { variant: "outline", label: "Completed" },
        FAILED: { variant: "destructive", label: "Failed" },
    }
    const m = map[s] ?? { variant: "secondary" as const, label: s }
    return (
        <Badge variant={m.variant} className="whitespace-nowrap">
            {m.label}
        </Badge>
    )
}

function fmtSol(n: number) {
    return `${n.toFixed(6)} SOL`
}

function fmtIso(d: string) {
    return new Date(d).toLocaleString()
}

function copyToClipboard(s: string, onDone: (t: string) => void) {
    void navigator.clipboard.writeText(s).then(() => onDone("Copied to clipboard."))
}

export function CustodyDashboard() {
    const isMobile = useIsMobile()
    const router = useRouter()
    const { toast } = useToast()
    const user = useAppSelector((s) => s.user.user)
    const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated)
    const authLoading = useAppSelector((s) => s.user.loading)
    const initialFetchDone = useAppSelector((s) => s.user._initialFetchDone)
    const isAdmin = user?.roles?.includes("admin") ?? false

    const [wallet, setWallet] = useState<WalletInfo | null>(null)
    const [walletLoading, setWalletLoading] = useState(true)
    const [stats, setStats] = useState<CustodyStats | null>(null)
    const [pending, setPending] = useState<PurchaseRow[]>([])
    const [allTx, setAllTx] = useState<PurchaseRow[]>([])
    const [txPage, setTxPage] = useState(1)
    const [txTotalPages, setTxTotalPages] = useState(1)
    const [txStatus, setTxStatus] = useState<string>("ALL")
    const [issues, setIssues] = useState<ReadinessIssue[]>([])
    const [loading, setLoading] = useState(true)
    const [refundId, setRefundId] = useState<string | null>(null)
    const [refundSol, setRefundSol] = useState<number>(0)
    const [refundWallet, setRefundWallet] = useState("")
    const [refundProcessing, setRefundProcessing] = useState(false)

    useEffect(() => {
        if (authLoading || !initialFetchDone) return
        if (!isAuthenticated || !user) {
            router.push("/login?next=/admin/custody")
            return
        }
        if (!isAdmin) {
            router.push("/dashboard?error=unauthorized")
        }
    }, [authLoading, initialFetchDone, isAuthenticated, isAdmin, user, router])

    const loadWallet = useCallback(async () => {
        setWalletLoading(true)
        try {
            const r = await fetch("/api/admin/wallet-info", { credentials: "include" })
            const j = await r.json()
            if (j.success && j.data) setWallet(j.data)
        } finally {
            setWalletLoading(false)
        }
    }, [])

    const loadStats = useCallback(async () => {
        const r = await fetch("/api/admin/custody-stats", { credentials: "include" })
        const j = await r.json()
        if (j.success && j.data) setStats(j.data)
    }, [])

    const loadPending = useCallback(async () => {
        const r = await fetch("/api/admin/pending-settlements", { credentials: "include" })
        const j = await r.json()
        if (j.success) setPending(j.data as PurchaseRow[])
    }, [])

    const loadAllTx = useCallback(async (page: number, status: string) => {
        const u = new URL("/api/admin/all-transactions", window.location.origin)
        u.searchParams.set("page", String(page))
        if (status && status !== "ALL") u.searchParams.set("status", status)
        const r = await fetch(u.toString(), { credentials: "include" })
        const j = await r.json()
        if (j.success) {
            setAllTx(j.data as PurchaseRow[])
            if (j.meta) {
                setTxPage(j.meta.page)
                setTxTotalPages(j.meta.totalPages)
            }
        }
    }, [])

    const loadReadiness = useCallback(async () => {
        const r = await fetch("/api/admin/readiness-issues", { credentials: "include" })
        const j = await r.json()
        if (j.success && j.data?.issues) setIssues(j.data.issues)
    }, [])

    const refreshAll = useCallback(async () => {
        setLoading(true)
        try {
            await Promise.all([loadWallet(), loadStats(), loadPending(), loadReadiness()])
        } finally {
            setLoading(false)
        }
    }, [loadWallet, loadStats, loadPending, loadReadiness])

    useEffect(() => {
        if (!isAdmin || !initialFetchDone) return
        void refreshAll()
    }, [isAdmin, initialFetchDone, refreshAll])

    useEffect(() => {
        if (!isAdmin) return
        void loadAllTx(txPage, txStatus)
    }, [isAdmin, txPage, txStatus, loadAllTx])

    const canRefund = useCallback((p: PurchaseRow) => {
        if (p.refundTxHash) return false
        if (p.status !== "ESCROW_RECEIVED" && p.status !== "FAILED") return false
        const age = Date.now() - new Date(p.createdAt).getTime()
        return age >= 10 * 60 * 1000
    }, [])

    const onConfirmRefund = async () => {
        if (!refundId) return
        setRefundProcessing(true)
        try {
            const r = await fetch("/api/admin/refund-purchase", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purchaseId: refundId }),
            })
            const j = await r.json()
            if (!r.ok) {
                toast({ title: "Refund failed", description: j.message || "Error", variant: "destructive" })
                return
            }
            const sol = j.data?.amountRefundedSol as number | undefined
            const h = j.data?.refundTxHash as string | undefined
            const desc =
                h != null
                    ? `Refund of ${sol != null ? fmtSol(sol) : "SOL"}. Explorer: ${shortHash(h)}`
                    : `Refund of ${sol != null ? fmtSol(sol) : "SOL"} sent.`
            toast({ title: "Refund sent", description: desc })
            setRefundId(null)
            void refreshAll()
            void loadAllTx(txPage, txStatus)
        } finally {
            setRefundProcessing(false)
        }
    }

    if (authLoading || !initialFetchDone || !isAuthenticated || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <AdminSidebar />
            <SidebarInset className="min-h-svh">
                <AdminTopBar />
                <main className="px-4 pb-10 pt-4 md:px-6 space-y-6">
                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-semibold">Custody &amp; Escrow</h1>
                            <Badge variant="destructive" className="font-semibold">
                                ADMIN
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Read-only monitoring of the admin wallet, escrow stats, and settlement queues.
                        </p>
                    </div>

                    {/* Admin wallet */}
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Admin wallet</CardTitle>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void loadWallet()}
                                disabled={walletLoading}
                                aria-label="Refresh balance"
                            >
                                <RefreshCw className={walletLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {walletLoading && !wallet ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : wallet ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm break-all">{wallet.publicKey}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() =>
                                                copyToClipboard(wallet.publicKey, (t) => toast({ title: t }))
                                            }
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Badge variant="secondary">
                                            {wallet.network === "mainnet" ? "Mainnet" : "Devnet"}
                                        </Badge>
                                    </div>
                                    <p className="text-3xl font-semibold tabular-nums">
                                        {wallet.balanceSol.toFixed(4)} <span className="text-lg font-normal">SOL</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ≈ ${wallet.balanceUsd.toFixed(2)} USD
                                        <span className="mx-2">·</span>
                                        1 SOL ≈ ${wallet.solPriceUsd.toFixed(2)}
                                    </p>
                                    {wallet.balanceSol < 0.1 && (
                                        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>
                                                Low balance — top up the admin wallet to ensure transactions can
                                                settle.
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Could not load wallet info.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    {stats && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[
                                { k: "Pending", v: stats.totalPending, c: "text-amber-600" },
                                { k: "Escrow received", v: stats.totalEscrowReceived, c: "text-blue-600" },
                                { k: "Completed", v: stats.totalCompleted, c: "text-emerald-600" },
                                { k: "Failed", v: stats.totalFailed, c: "text-destructive" },
                                { k: "SOL in escrow (sum)", v: fmtSol(stats.totalSolHeld), c: "text-foreground" },
                                { k: "Platform fees (COMPLETED)", v: fmtSol(stats.totalPlatformFeesCollected), c: "" },
                                { k: "Volume (COMPLETED)", v: fmtSol(stats.totalVolumeSol), c: "" },
                            ].map((s) => (
                                <Card key={s.k}>
                                    <CardContent className="p-4">
                                        <p className="text-2xl font-semibold tabular-nums">
                                            {typeof s.v === "number" ? s.v.toLocaleString() : s.v}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{s.k}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pending */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Pending &amp; stuck settlements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : pending.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No pending settlements — all transactions are settled.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Property</TableHead>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead>Seller</TableHead>
                                            <TableHead>Tokens</TableHead>
                                            <TableHead>SOL paid</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tx links</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pending.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {fmtIso(p.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-mono text-xs">{p.property.referenceId}</div>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[140px]">
                                                    <div className="truncate">{p.buyer.email || p.buyer.name || "—"}</div>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[140px]">
                                                    <div className="truncate">{p.seller.email || p.seller.name || "—"}</div>
                                                </TableCell>
                                                <TableCell>{p.tokensBought}</TableCell>
                                                <TableCell className="text-xs tabular-nums">
                                                    {fmtSol(p.totalSolPaid)}
                                                </TableCell>
                                                <TableCell>{statusBadge(p.status)}</TableCell>
                                                <TableCell className="text-xs space-y-1 max-w-[200px]">
                                                    {p.solTransferTxHash && <TruncLink hash={p.solTransferTxHash} label="Pay" />}
                                                    {p.tokenTransferTxHash && <TruncLink hash={p.tokenTransferTxHash} label="Token" />}
                                                    {p.solReleaseTxHash && <TruncLink hash={p.solReleaseTxHash} label="Release" />}
                                                </TableCell>
                                                <TableCell>
                                                    {canRefund(p) && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-7 text-xs"
                                                            onClick={() => {
                                                                setRefundId(p.id)
                                                                setRefundSol(p.totalSolPaid)
                                                                setRefundWallet(p.buyer.walletAddress || "")
                                                            }}
                                                        >
                                                            Refund
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <AlertDialog
                        open={refundId != null}
                        onOpenChange={() => {
                            if (!refundProcessing) setRefundId(null)
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm refund</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div>
                                        Refund {fmtSol(refundSol)} to{" "}
                                        <span className="font-mono break-all">{refundWallet || "buyer"}</span>? This
                                        cannot be undone.
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={refundProcessing}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        void onConfirmRefund()
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={refundProcessing}
                                >
                                    {refundProcessing ? "Processing…" : "Confirm refund"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Readiness */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Listing readiness (seller ATA)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {issues.length === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    All active listings have sufficient on-chain token balance in the seller&apos;s ATA
                                    for the remaining listing size.
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-destructive mb-3">
                                        These listings cannot fully settle on seller-wallet custody — seller does not
                                        hold enough tokens in their ATA (platform-minted custody is not counted here).
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Seller</TableHead>
                                                <TableHead>Tokens listed (remaining)</TableHead>
                                                <TableHead>Tokens in custody (seller ATA)</TableHead>
                                                <TableHead>Gap</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {issues.map((i) => (
                                                <TableRow key={i.listingId}>
                                                    <TableCell className="font-mono text-xs">
                                                        {i.propertyReferenceId}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {i.sellerName || i.sellerEmail || shortHash(i.sellerWallet)}
                                                    </TableCell>
                                                    <TableCell>{i.tokensRemaining}</TableCell>
                                                    <TableCell>{i.tokensInCustodyWhole}</TableCell>
                                                    <TableCell className="text-destructive font-medium">{i.gap}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* All transactions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Transaction history</CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <Select
                                    value={txStatus}
                                    onValueChange={(v) => {
                                        setTxStatus(v)
                                        setTxPage(1)
                                    }}
                                >
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="ESCROW_RECEIVED">Escrow received</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="FAILED">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {allTx.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No records.</p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Buyer</TableHead>
                                                <TableHead>Seller</TableHead>
                                                <TableHead>Tokens</TableHead>
                                                <TableHead>SOL paid</TableHead>
                                                <TableHead>USD / SOL@buy</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Tx / Refund</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allTx.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="text-xs whitespace-nowrap">
                                                        {fmtIso(p.createdAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-xs">{p.property.referenceId}</span>
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[120px] truncate">
                                                        {p.buyer.email}
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[120px] truncate">
                                                        {p.seller.email}
                                                    </TableCell>
                                                    <TableCell>{p.tokensBought}</TableCell>
                                                    <TableCell className="text-xs tabular-nums">
                                                        {fmtSol(p.totalSolPaid)}
                                                    </TableCell>
                                                    <TableCell className="text-xs tabular-nums">
                                                        {p.solPriceUsdAtPurchase != null
                                                            ? p.solPriceUsdAtPurchase.toFixed(4)
                                                            : "—"}{" "}
                                                        (SOL/USD @ purchase)
                                                    </TableCell>
                                                    <TableCell>{statusBadge(p.status)}</TableCell>
                                                    <TableCell className="text-xs space-y-1 max-w-[220px]">
                                                        {p.solTransferTxHash && <TruncLink hash={p.solTransferTxHash} label="Pay" />}
                                                        {p.tokenTransferTxHash && <TruncLink hash={p.tokenTransferTxHash} label="Token" />}
                                                        {p.solReleaseTxHash && <TruncLink hash={p.solReleaseTxHash} label="Release" />}
                                                        {p.refundTxHash && (
                                                            <div>
                                                                Refund: <TruncLink hash={p.refundTxHash} />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={txPage <= 1}
                                            onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            Page {txPage} of {txTotalPages}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={txPage >= txTotalPages}
                                            onClick={() => setTxPage((p) => p + 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
