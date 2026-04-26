"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText,
    Building2,
    Calendar,
    Shield,
    Flag,
    X,
    DollarSign,
    User,
    Loader2,
    Download,
    Eye,
    Coins,
    ExternalLink,
    ShieldCheck,
    RefreshCw,
    AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { PropertyApplication } from "@/components/admin/property-approvals-tab"
import { formatDistanceToNow } from "date-fns"
import { effectivePropertyValuationUsd } from "@/lib/property-valuation"

type ModalType = "approve" | "reject" | "preview" | "mint" | null
const FIXED_TOKEN_SUPPLY = 1000

function isAbsoluteDocumentUrl(url: string): boolean {
    return /^https?:\/\//i.test(url)
}

function getDocumentServeUrl(fileUrl: string): string {
    if (isAbsoluteDocumentUrl(fileUrl)) return fileUrl
    return `/api${fileUrl}`
}

function getDocumentDownloadUrl(fileUrl: string): string {
    const serveUrl = getDocumentServeUrl(fileUrl)
    if (isAbsoluteDocumentUrl(fileUrl)) return serveUrl
    const separator = serveUrl.includes("?") ? "&" : "?"
    return `${serveUrl}${separator}download=1`
}

type PropertyVerificationPayload = {
    id: string
    propertyId: string
    scrapedAt: string | null
    scrapeStatus: "PENDING" | "SUCCESS" | "FAILED"
    scrapeError: string | null
    address: string | null
    ownerName: string | null
    propertyType: string | null
    taxClass: string | null
    yearBuilt: string | null
    numberOfStories: string | null
    totalArea: string | null
    residentialUnits: string | null
    commercialUnits: string | null
    frontage: string | null
    landDepth: string | null
    landArea: string | null
    estimatedPrice: string | null
}

function normalizeCompareToken(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function numericTokensEqual(a: string, b: string): boolean {
    const na = parseFloat(a.replace(/[^0-9.-]/g, ""))
    const nb = parseFloat(b.replace(/[^0-9.-]/g, ""))
    if (Number.isNaN(na) || Number.isNaN(nb)) return false
    return na === nb
}

/** True when both sides have text and match (case-insensitive / loose numeric). */
function verificationValuesMatch(userDisplay: string, scraped: string | null | undefined): boolean {
    if (scraped == null || scraped.trim() === "") return false
    const u = userDisplay.trim()
    const s = scraped.trim()
    if (!u) return false
    if (normalizeCompareToken(u) === normalizeCompareToken(s)) return true
    if (numericTokensEqual(u, s)) return true
    return false
}

/** True when both have values and they differ. */
function verificationValuesMismatch(userDisplay: string, scraped: string | null | undefined): boolean {
    if (scraped == null || scraped.trim() === "") return false
    const u = userDisplay.trim()
    if (!u) return false
    return !verificationValuesMatch(userDisplay, scraped)
}

interface PropertyDetail {
    id: string
    referenceId: string
    propertyAddress: string
    ownerName: string
    borough: string
    block: string
    lot: string
    propertyType: string
    taxClass: string
    yearBuilt: number | null
    stories: number | null
    totalAreaSqFt: number | null
    residentialUnits: number | null
    commercialUnits: number | null
    lotFrontage: number | null
    lotDepth: number | null
    landAreaSqFt: number | null
    estimatedPriceUSD: number
    verifiedPriceUSD: number | null
    walletAddress: string
    status: string
    adminNotes: string | null
    submittedAt: string
    reviewedAt: string | null
    // Minting fields
    mintAddress: string | null
    mintSignature: string | null
    mintedAt: string | null
    tokenSupply: number | null
    documents: {
        id: string
        documentType: string
        fileName: string
        fileUrl: string
        mimeType: string
        fileSizeBytes: number | null
        status: string
        uploadedAt: string
        verifiedAt: string | null
        verifiedBy: string | null
    }[]
    statusHistory: {
        id: string
        fromStatus: string
        toStatus: string
        changedBy: string
        reason: string | null
        createdAt: string
    }[]
    owner: {
        name: string
        email: string
        walletAddress: string | null
        kycStatus: string
    }
    verificationData?: PropertyVerificationPayload | null
}

export function PropertyDetailsPanel({
    property,
    onClose,
    onPropertyUpdated,
}: {
    property: PropertyApplication
    onClose: () => void
    onPropertyUpdated?: () => void
}) {
    const { toast } = useToast()
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)
    const [previewDoc, setPreviewDoc] = useState<{ url: string; downloadUrl: string; name: string; mimeType: string } | null>(null)
    const [detail, setDetail] = useState<PropertyDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(true)
    const [mintResult, setMintResult] = useState<{
        mintAddress: string
        signature: string
        explorerUrl: string
        txUrl: string
    } | null>(null)
    const [rescrapeLoading, setRescrapeLoading] = useState(false)

    useEffect(() => {
        let cancelled = false
        setDetailLoading(true)
        fetch(`/api/admin/properties/${property.id}`, { credentials: "include" })
            .then((res) => res.json())
            .then((json) => {
                if (!cancelled && json.success) setDetail(json.data)
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setDetailLoading(false) })
        return () => { cancelled = true }
    }, [property.id, property.verifiedPriceUSD])

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price)

    const refreshPropertyDetail = async () => {
        try {
            const refreshed = await fetch(`/api/admin/properties/${property.id}`, { credentials: "include" })
            const detailJson = await refreshed.json()
            if (detailJson.success) setDetail(detailJson.data)
        } catch (e) {
            console.error(e)
        }
    }

    const handleRescrapeVerification = async () => {
        if (!detail) return
        setRescrapeLoading(true)
        try {
            const res = await fetch("/api/admin/rescrape-property", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ propertyId: detail.id }),
            })
            const json = await res.json().catch(() => ({}))
            await refreshPropertyDetail()
            if (res.ok && json.success) {
                toast({ title: "Verification updated", description: "Official NYC data was refreshed." })
            } else {
                toast({
                    title: "Verification failed",
                    description: typeof json.message === "string" ? json.message : "Could not scrape official data.",
                    variant: "destructive",
                })
            }
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setRescrapeLoading(false)
        }
    }

    const handleApprove = async () => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/properties/${property.id}/review`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "APPROVE" }),
            })
            const json = await res.json()
            if (res.ok && json.success) {
                const minting = json?.data?.minting as
                    | { attempted?: boolean; success?: boolean; message?: string }
                    | undefined

                if (minting?.attempted && minting.success) {
                    toast({
                        title: "Property Approved & Minted",
                        description: `${FIXED_TOKEN_SUPPLY.toLocaleString()} AG tokens were minted for ${property.propertyAddress}.`,
                    })
                } else if (minting?.attempted && minting.success === false) {
                    toast({
                        title: "Property Approved (Mint Failed)",
                        description: minting.message || "Property was approved, but token minting failed. Retry from the Token Minting section.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Property Approved",
                        description: `${property.propertyAddress} has been approved.`,
                    })
                }

                setActiveModal(null)
                onPropertyUpdated?.()
            } else {
                toast({ title: "Error", description: json.message || "Failed to approve.", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast({ title: "Error", description: "Please provide a reason for rejection.", variant: "destructive" })
            return
        }
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/properties/${property.id}/review`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "REJECT", adminNotes: rejectionReason }),
            })
            const json = await res.json()
            if (res.ok && json.success) {
                toast({ title: "Property Rejected", description: `${property.propertyAddress} has been rejected.`, variant: "destructive" })
                setActiveModal(null)
                setRejectionReason("")
                onPropertyUpdated?.()
            } else {
                toast({ title: "Error", description: json.message || "Failed to reject.", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleMint = async () => {
        if (!detail) return

        setActionLoading(true)
        setMintResult(null)
        try {
            const res = await fetch("/api/admin/mint-property", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    propertyId: detail.id,
                    userWalletAddress: detail.walletAddress,
                }),
            })
            const json = await res.json()
            if (res.ok && json.success) {
                setMintResult({
                    mintAddress: json.data.mintAddress,
                    signature: json.data.signature,
                    explorerUrl: json.data.explorerUrl,
                    txUrl: json.data.txUrl,
                })
                toast({
                    title: "Tokens Minted Successfully!",
                    description: `${FIXED_TOKEN_SUPPLY.toLocaleString()} AG tokens created for ${property.propertyAddress}`,
                })
                onPropertyUpdated?.()
            } else {
                toast({ title: "Minting Failed", description: json.message || "Failed to mint tokens.", variant: "destructive" })
            }
        } catch (err) {
            console.error("Minting error:", err)
            toast({ title: "Error", description: "Network error during minting.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING": return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">Pending</Badge>
            case "UNDER_REVIEW": return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs">Under Review</Badge>
            case "APPROVED": return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">Approved</Badge>
            case "REJECTED": return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 text-xs">Rejected</Badge>
            default: return <Badge variant="outline" className="text-xs">{status}</Badge>
        }
    }

    return (
        <>
            <Card className="h-fit">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Property Details</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[calc(250vh)] overflow-y-auto">
                    {detailLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !detail ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Failed to load details.</p>
                    ) : (
                        <>
                            {/* Property Information */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Building2 className="h-4 w-4" />
                                    Property Information
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Address:</span>
                                        <span className="font-medium text-right max-w-[60%]">{detail.propertyAddress}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Reference ID:</span>
                                        <span className="font-medium">{detail.referenceId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">BBL:</span>
                                        <span className="font-medium">{detail.borough}-{detail.block}-{detail.lot}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="font-medium">{detail.propertyType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax Class:</span>
                                        <span className="font-medium">{detail.taxClass}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        {getStatusBadge(detail.status)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Submitted:</span>
                                        <span className="font-medium">{new Date(detail.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* User vs official NYC portal */}
                            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold">Official source verification</div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {!detail.verificationData ? (
                                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                                    No verification data
                                                </Badge>
                                            ) : detail.verificationData.scrapeStatus === "SUCCESS" ? (
                                                <Badge className="border border-emerald-500/25 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-400">
                                                    Verified
                                                </Badge>
                                            ) : detail.verificationData.scrapeStatus === "FAILED" ? (
                                                <Badge className="bg-red-500/10 text-xs text-red-700 dark:text-red-400">
                                                    Scrape Failed
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/10 text-xs text-amber-800 dark:text-amber-400">
                                                    Pending
                                                </Badge>
                                            )}
                                            {detail.verificationData?.scrapedAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    Last verified:{" "}
                                                    {formatDistanceToNow(new Date(detail.verificationData.scrapedAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        {detail.verificationData?.scrapeStatus === "FAILED" && detail.verificationData.scrapeError && (
                                            <p className="text-xs text-destructive">{detail.verificationData.scrapeError}</p>
                                        )}
                                    </div>
                                    {(!detail.verificationData ||
                                        detail.verificationData.scrapeStatus === "FAILED" ||
                                        detail.verificationData.scrapeStatus === "PENDING") && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 gap-1.5"
                                            disabled={rescrapeLoading}
                                            onClick={handleRescrapeVerification}
                                        >
                                            {rescrapeLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            )}
                                            Re-run Verification
                                        </Button>
                                    )}
                                </div>

                                {!detail.verificationData ? (
                                    <p className="text-xs text-muted-foreground">
                                        No scrape has been stored for this property yet. Click Re-run Verification to fetch NYC portal data.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto rounded-md border border-border bg-background/80">
                                        <div className="grid min-w-[520px] grid-cols-[1fr_1fr_1fr] gap-0 text-xs">
                                            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-2 py-2 font-semibold">
                                                <span className="text-muted-foreground">Field</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-2 py-2 font-semibold">
                                                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                User Submitted
                                            </div>
                                            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-2 py-2 font-semibold">
                                                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                Official Source
                                            </div>
                                            {(
                                                [
                                                    {
                                                        label: "Address",
                                                        userText: detail.propertyAddress,
                                                        scraped: detail.verificationData.address,
                                                    },
                                                    {
                                                        label: "Owner Name",
                                                        userText: detail.ownerName,
                                                        scraped: detail.verificationData.ownerName,
                                                    },
                                                    {
                                                        label: "Property Type",
                                                        userText: detail.propertyType,
                                                        scraped: detail.verificationData.propertyType,
                                                    },
                                                    {
                                                        label: "Year Built",
                                                        userText:
                                                            detail.yearBuilt != null ? String(detail.yearBuilt) : "",
                                                        scraped: detail.verificationData.yearBuilt,
                                                    },
                                                    {
                                                        label: "Total Area",
                                                        userText:
                                                            detail.totalAreaSqFt != null
                                                                ? `${detail.totalAreaSqFt.toLocaleString()} sq ft`
                                                                : "",
                                                        scraped: detail.verificationData.totalArea,
                                                    },
                                                    {
                                                        label: "Number of Stories",
                                                        userText:
                                                            detail.stories != null ? String(detail.stories) : "",
                                                        scraped: detail.verificationData.numberOfStories,
                                                    },
                                                    {
                                                        label: "Residential Units",
                                                        userText:
                                                            detail.residentialUnits != null
                                                                ? String(detail.residentialUnits)
                                                                : "",
                                                        scraped: detail.verificationData.residentialUnits,
                                                    },
                                                    {
                                                        label: "Commercial Units",
                                                        userText:
                                                            detail.commercialUnits != null
                                                                ? String(detail.commercialUnits)
                                                                : "",
                                                        scraped: detail.verificationData.commercialUnits,
                                                    },
                                                    {
                                                        label: "Estimated Price",
                                                        userText: formatPrice(detail.estimatedPriceUSD),
                                                        scraped: detail.verificationData.estimatedPrice,
                                                    },
                                                ] as const
                                            ).map((row) => {
                                                const scrapedDisplay =
                                                    row.scraped != null && row.scraped.trim() !== ""
                                                        ? row.scraped
                                                        : null
                                                const mismatch = verificationValuesMismatch(row.userText, row.scraped)
                                                const match =
                                                    scrapedDisplay != null &&
                                                    verificationValuesMatch(row.userText, row.scraped)
                                                const rowClass = mismatch
                                                    ? "bg-amber-500/15 dark:bg-amber-500/10"
                                                    : ""
                                                return (
                                                    <div key={row.label} className={`contents ${rowClass}`}>
                                                        <div
                                                            className={`flex items-center gap-1 border-b border-border px-2 py-2 ${rowClass}`}
                                                        >
                                                            <span className="text-muted-foreground">{row.label}</span>
                                                            {mismatch && (
                                                                <AlertTriangle
                                                                    className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-500"
                                                                    aria-hidden
                                                                />
                                                            )}
                                                            {match && (
                                                                <CheckCircle2
                                                                    className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500"
                                                                    aria-hidden
                                                                />
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`border-b border-border px-2 py-2 font-medium ${rowClass}`}
                                                        >
                                                            {row.userText || "—"}
                                                        </div>
                                                        <div
                                                            className={`border-b border-border px-2 py-2 text-muted-foreground ${rowClass}`}
                                                        >
                                                            {scrapedDisplay ?? (
                                                                <span className="text-muted-foreground/70">—</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Building Details */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Shield className="h-4 w-4" />
                                    Building Details
                                </div>
                                <div className="space-y-2 text-sm">
                                    {detail.yearBuilt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Year Built:</span>
                                            <span className="font-medium">{detail.yearBuilt}</span>
                                        </div>
                                    )}
                                    {detail.stories && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Stories:</span>
                                            <span className="font-medium">{detail.stories}</span>
                                        </div>
                                    )}
                                    {detail.totalAreaSqFt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Area:</span>
                                            <span className="font-medium">{detail.totalAreaSqFt.toLocaleString()} sq ft</span>
                                        </div>
                                    )}
                                    {detail.residentialUnits != null && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Residential Units:</span>
                                            <span className="font-medium">{detail.residentialUnits}</span>
                                        </div>
                                    )}
                                    {detail.commercialUnits != null && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Commercial Units:</span>
                                            <span className="font-medium">{detail.commercialUnits}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Owner Information */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <User className="h-4 w-4" />
                                    Owner Information
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{detail.owner.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium text-right max-w-[60%] break-all">{detail.owner.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">KYC Status:</span>
                                        <Badge variant={detail.owner.kycStatus === "VERIFIED" ? "default" : "secondary"} className="text-xs">
                                            {detail.owner.kycStatus}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Wallet:</span>
                                        <span className="font-medium text-xs font-mono">
                                            {detail.walletAddress.slice(0, 6)}...{detail.walletAddress.slice(-4)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Valuation */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <DollarSign className="h-4 w-4" />
                                    Valuation
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Owner submitted:</span>
                                        <span className="font-medium">{formatPrice(detail.estimatedPriceUSD)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Effective (mint / portfolio):</span>
                                        <span className="font-medium text-primary">
                                            {formatPrice(
                                                effectivePropertyValuationUsd(
                                                    detail.estimatedPriceUSD,
                                                    detail.verifiedPriceUSD,
                                                ),
                                            )}
                                        </span>
                                    </div>
                                    {detail.landAreaSqFt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Land Area:</span>
                                            <span className="font-medium">{detail.landAreaSqFt.toLocaleString()} sq ft</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Documents */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <FileText className="h-4 w-4" />
                                    Documents ({detail.documents.length})
                                </div>
                                {detail.documents.map((doc) => {
                                    const serveUrl = getDocumentServeUrl(doc.fileUrl)
                                    const downloadUrl = getDocumentDownloadUrl(doc.fileUrl)
                                    const mimeType = doc.mimeType || ""
                                    const canPreview = mimeType === "application/pdf" ||
                                        mimeType.startsWith("image/")
                                    return (
                                        <div key={doc.id} className="p-3 border rounded-lg space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{doc.documentType.replace(/_/g, " ")}</span>
                                                {doc.status === "VERIFIED" ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : doc.status === "REJECTED" ? (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {doc.fileName}
                                                {doc.fileSizeBytes && ` • ${(doc.fileSizeBytes / 1024).toFixed(0)} KB`}
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                {canPreview && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7 flex-1"
                                                        onClick={() => {
                                                            setPreviewDoc({ url: serveUrl, downloadUrl, name: doc.fileName, mimeType })
                                                            setActiveModal("preview")
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Preview
                                                    </Button>
                                                )}
                                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                    <Button size="sm" variant="outline" className="text-xs h-7 w-full">
                                                        <Download className="h-3 w-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    )
                                })}
                                {detail.documents.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                                )}
                            </div>

                            <Separator />

                            {/* Status History */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Calendar className="h-4 w-4" />
                                    Status History
                                </div>
                                <div className="space-y-2">
                                    {detail.statusHistory.map((entry) => (
                                        <div key={entry.id} className="flex gap-2 text-xs">
                                            <div className="text-muted-foreground min-w-20">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </div>
                                            <div>
                                                {entry.fromStatus} → {entry.toStatus}
                                                {entry.reason && <span className="text-muted-foreground"> — {entry.reason}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {detail.statusHistory.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No history yet.</p>
                                    )}
                                </div>
                            </div>

                            {detail.adminNotes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Flag className="h-4 w-4" />
                                            Admin Notes
                                        </div>
                                        <p className="text-sm text-muted-foreground">{detail.adminNotes}</p>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Action Buttons - only show if not already finalized */}
                            {(detail.status === "PENDING" || detail.status === "UNDER_REVIEW") && (
                                <div className="space-y-2 pt-2">
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setActiveModal("approve")}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve Property
                                    </Button>
                                    <Button className="w-full" variant="destructive" onClick={() => setActiveModal("reject")}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Property
                                    </Button>
                                </div>
                            )}

                            {/* Minting Section - show for APPROVED properties */}
                            {detail.status === "APPROVED" && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Coins className="h-4 w-4" />
                                            Token Minting
                                        </div>
                                        {detail.mintAddress ? (
                                            // Already minted - show token info
                                            <div className="space-y-2 text-sm">
                                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium mb-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Tokens Minted
                                                    </div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Supply:</span>
                                                            <span className="font-medium">{detail.tokenSupply?.toLocaleString()} AG</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Minted:</span>
                                                            <span className="font-medium">
                                                                {detail.mintedAt ? new Date(detail.mintedAt).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Mint Address:</span>
                                                            <a
                                                                href={`https://explorer.solana.com/address/${detail.mintAddress}?cluster=devnet`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-mono text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                {detail.mintAddress.slice(0, 6)}...{detail.mintAddress.slice(-4)}
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Not minted yet - show mint button
                                            <div className="space-y-3">
                                                <p className="text-xs text-muted-foreground">
                                                    This property is approved and ready for tokenization.
                                                    Mint tokens to distribute ownership shares to the property owner.
                                                </p>
                                                <div className="p-3 bg-muted rounded-lg space-y-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Valuation:</span>
                                                        <span className="font-medium">
                                                            {formatPrice(
                                                                effectivePropertyValuationUsd(
                                                                    detail.estimatedPriceUSD,
                                                                    detail.verifiedPriceUSD,
                                                                ),
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Owner Wallet:</span>
                                                        <span className="font-mono">
                                                            {detail.walletAddress.slice(0, 6)}...{detail.walletAddress.slice(-4)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full bg-violet-600 hover:bg-violet-700"
                                                    onClick={() => setActiveModal("mint")}
                                                >
                                                    <Coins className="mr-2 h-4 w-4" />
                                                    Mint Property Tokens
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Approval Modal */}
            <Dialog open={activeModal === "approve"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Property Listing</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve {property.propertyAddress}? It will become available for tokenization.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={activeModal === "reject"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Property Listing</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this property. The owner will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Enter the reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)} disabled={actionLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Preview Modal */}
            <Dialog open={activeModal === "preview"} onOpenChange={() => { setActiveModal(null); setPreviewDoc(null) }}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {previewDoc?.name || "Document Preview"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden rounded border bg-muted">
                        {previewDoc?.mimeType === "application/pdf" ? (
                            <iframe
                                src={previewDoc.url}
                                className="w-full h-full"
                                title={previewDoc.name}
                            />
                        ) : previewDoc?.mimeType.startsWith("image/") ? (
                            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewDoc.url}
                                    alt={previewDoc.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : (
                            <p className="p-4 text-sm text-muted-foreground">Preview not available for this file type.</p>
                        )}
                    </div>
                    <DialogFooter>
                        {previewDoc && (
                            <a href={previewDoc.downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </a>
                        )}
                        <Button variant="outline" onClick={() => { setActiveModal(null); setPreviewDoc(null) }}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mint Tokens Modal */}
            <Dialog open={activeModal === "mint"} onOpenChange={() => { setActiveModal(null); setMintResult(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            Mint Property Tokens
                        </DialogTitle>
                        <DialogDescription>
                            Create Token-2022 tokens for this property on Solana Devnet.
                        </DialogDescription>
                    </DialogHeader>

                    {mintResult ? (
                        // Success state
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium mb-3">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Tokens Minted Successfully!
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Mint Address:</span>
                                        <p className="font-mono text-xs break-all mt-1">{mintResult.mintAddress}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Transaction:</span>
                                        <p className="font-mono text-xs break-all mt-1">{mintResult.signature}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={mintResult.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full text-xs">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View Token
                                    </Button>
                                </a>
                                <a
                                    href={mintResult.txUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full text-xs">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View Transaction
                                    </Button>
                                </a>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => { setActiveModal(null); setMintResult(null) }}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        // Input state
                        <>
                            {detail && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Property:</span>
                                            <span className="font-medium text-right max-w-[60%]">{detail.propertyAddress}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Valuation:</span>
                                            <span className="font-medium">
                                                {formatPrice(
                                                    effectivePropertyValuationUsd(
                                                        detail.estimatedPriceUSD,
                                                        detail.verifiedPriceUSD,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Owner Wallet:</span>
                                            <span className="font-mono text-xs">
                                                {detail.walletAddress.slice(0, 8)}...{detail.walletAddress.slice(-6)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Token Supply:</span>
                                            <span className="font-medium">{FIXED_TOKEN_SUPPLY.toLocaleString()} AG</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Price per token:</span>
                                            <span className="font-medium">
                                                {formatPrice(
                                                    effectivePropertyValuationUsd(
                                                        detail.estimatedPriceUSD,
                                                        detail.verifiedPriceUSD,
                                                    ) / FIXED_TOKEN_SUPPLY,
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground pt-1">
                                            Supply is fixed at 1,000 tokens for every property.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-1.5">
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                            <strong>Note:</strong> This action is irreversible. The mint authority will be revoked
                                            after minting, making the token supply immutable.
                                        </p>
                                        <p className="text-xs text-yellow-800/90 dark:text-yellow-200/90">
                                            The full supply is minted to the <strong>platform custodian</strong> (admin wallet) so
                                            marketplace sales can complete without the owner signing a token approval. Economic
                                            ownership still follows the property owner in the app.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setActiveModal(null)} disabled={actionLoading}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleMint}
                                    className="bg-violet-600 hover:bg-violet-700"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Minting...
                                        </>
                                    ) : (
                                        <>
                                            <Coins className="h-4 w-4 mr-2" />
                                            Mint Tokens
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
