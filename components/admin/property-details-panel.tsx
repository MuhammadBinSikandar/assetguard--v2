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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { PropertyApplication } from "@/components/admin/property-approvals-tab"

type ModalType = "approve" | "reject" | "preview" | null

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
    walletAddress: string
    status: string
    adminNotes: string | null
    submittedAt: string
    reviewedAt: string | null
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
    const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; mimeType: string } | null>(null)
    const [detail, setDetail] = useState<PropertyDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(true)

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
    }, [property.id])

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price)

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
                toast({ title: "Property Approved", description: `${property.propertyAddress} has been approved.` })
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
                                        <span className="text-muted-foreground">Estimated Price:</span>
                                        <span className="font-medium text-primary">{formatPrice(detail.estimatedPriceUSD)}</span>
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
                                    const serveUrl = `/api${doc.fileUrl}`
                                    const canPreview = doc.mimeType === "application/pdf" ||
                                        doc.mimeType.startsWith("image/")
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
                                                            setPreviewDoc({ url: serveUrl, name: doc.fileName, mimeType: doc.mimeType })
                                                            setActiveModal("preview")
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Preview
                                                    </Button>
                                                )}
                                                <a href={`${serveUrl}?download=1`} target="_blank" rel="noopener noreferrer" className="flex-1">
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
                                            <div className="text-muted-foreground min-w-[80px]">
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
                            <a href={`${previewDoc.url}?download=1`} target="_blank" rel="noopener noreferrer">
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
        </>
    )
}
