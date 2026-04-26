"use client"

import { useState } from "react"
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
    FileText,
    User,
    Calendar,
    Eye,
    X,
    Loader2,
    ImageIcon,
    FileIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { KYCApplication } from "./kyc-approvals-tab"

type ModalType = "approve" | "reject" | null

/** Legacy rows may still be full URLs; new rows are Pinata CIDs only. */
function isLegacyStoredHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

export function KYCDetailsPanel({
    application,
    onClose,
    onActionComplete,
}: {
    application: KYCApplication
    onClose: () => void
    onActionComplete?: () => void
}) {
    const { toast } = useToast()
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)
    const [openingDocIdx, setOpeningDocIdx] = useState<number | null>(null)

    // ── API call to approve / reject ─────────────────────────────────────────

    const handleReview = async (status: "APPROVED" | "REJECTED", adminNotes?: string) => {
        setActionLoading(true)
        try {
            const res = await fetch("/api/kyc/review", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: application.userId,
                    status,
                    adminNotes: adminNotes || undefined,
                }),
            })
            const json = await res.json()

            if (json.success) {
                toast({
                    title: status === "APPROVED" ? "KYC Approved" : "KYC Rejected",
                    description: `${application.fullName}'s KYC has been ${status.toLowerCase()}.`,
                    variant: status === "APPROVED" ? "default" : "destructive",
                })
                setActiveModal(null)
                setRejectionReason("")
                onActionComplete?.()
                onClose()
            } else {
                toast({ title: "Error", description: json.message, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleApprove = () => handleReview("APPROVED")

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            })
            return
        }
        handleReview("REJECTED", rejectionReason)
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    const getFileIcon = (value: string) => {
        if (isLegacyStoredHttpUrl(value)) {
            if (/\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(value)) return <ImageIcon className="h-4 w-4" />
            if (/\.pdf(?:\?|$)/i.test(value)) return <FileIcon className="h-4 w-4" />
        }
        return <FileText className="h-4 w-4" />
    }

    const getFileLabel = (value: string, idx: number) => {
        if (isLegacyStoredHttpUrl(value)) {
            try {
                const u = new URL(value)
                const last = u.pathname.split("/").filter(Boolean).pop() ?? ""
                if (last) return last.slice(0, 80)
            } catch {
                /* ignore */
            }
            return `Document ${idx + 1}`
        }
        return `Document ${idx + 1} (${value.slice(0, 8)}…)`
    }

    const handleViewDocument = async (storedValue: string, idx: number) => {
        setOpeningDocIdx(idx)
        try {
            let openUrl: string
            if (isLegacyStoredHttpUrl(storedValue)) {
                openUrl = storedValue
            } else {
                const res = await fetch(
                    `/api/admin/kyc-document?cid=${encodeURIComponent(storedValue.trim())}`,
                    { credentials: "include" },
                )
                const json = await res.json().catch(() => ({}))
                if (!res.ok || typeof json.url !== "string") {
                    toast({
                        title: "Could not open document",
                        description:
                            typeof json.message === "string" ? json.message : "Failed to get a view link.",
                        variant: "destructive",
                    })
                    return
                }
                openUrl = json.url
            }
            window.open(openUrl, "_blank", "noopener,noreferrer")
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        } finally {
            setOpeningDocIdx(null)
        }
    }

    const isPending = application.user.kycStatus === "PENDING"

    return (
        <>
            <Card className="h-fit">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Review Details</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[calc(200vh)] overflow-y-auto">
                    {/* Status Banner */}
                    {!isPending && (
                        <div className={`p-3 rounded-lg text-sm font-medium text-center ${application.user.kycStatus === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            }`}>
                            {application.user.kycStatus === "APPROVED" ? "APPROVED" : "REJECTED"}
                            {application.reviewedAt && (
                                <span className="block text-xs font-normal mt-1">
                                    on {new Date(application.reviewedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    )}

                    {/* User Information */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <User className="h-4 w-4" />
                            User Information
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Full Name:</span>
                                <span className="font-medium">{application.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium truncate ml-2">{application.user.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Number:</span>
                                <span className="font-medium">{application.idNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID:</span>
                                <span className="font-medium text-xs truncate ml-2">{application.userId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Submitted:</span>
                                <span className="font-medium">
                                    {new Date(application.submittedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Uploaded Documents */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <FileText className="h-4 w-4" />
                            Uploaded Documents ({application.documentUrls.length})
                        </div>

                        {application.documentUrls.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                        )}

                        {application.documentUrls.map((storedValue, idx) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    {getFileIcon(storedValue)}
                                    <span className="text-sm font-medium truncate flex-1">
                                        {getFileLabel(storedValue, idx)}
                                    </span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 flex-1"
                                        disabled={openingDocIdx !== null}
                                        onClick={() => handleViewDocument(storedValue, idx)}
                                    >
                                        {openingDocIdx === idx ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                            <Eye className="h-3 w-3 mr-1" />
                                        )}
                                        View document
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Admin Notes (if previously reviewed) */}
                    {application.adminNotes && (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Calendar className="h-4 w-4" />
                                    Admin Notes
                                </div>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                    {application.adminNotes}
                                </p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Action Buttons – only for PENDING applications */}
                    {isPending && (
                        <div className="space-y-2 pt-2">
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setActiveModal("approve")}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve KYC
                            </Button>
                            <Button
                                className="w-full"
                                variant="destructive"
                                onClick={() => setActiveModal("reject")}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject KYC
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approval Confirmation Modal */}
            <Dialog open={activeModal === "approve"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve KYC Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this KYC application for{" "}
                            <strong>{application.fullName}</strong>?
                            This will grant them full access to the platform (property registration, minting, etc.).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={activeModal === "reject"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject KYC Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this application. The user will be able to
                            re-submit with corrected documents.
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
                        <Button variant="outline" onClick={() => setActiveModal(null)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
