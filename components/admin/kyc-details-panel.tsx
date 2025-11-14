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
    AlertCircle,
    FileText,
    User,
    MapPin,
    Calendar,
    Shield,
    Flag,
    MessageSquare,
    Download,
    Eye,
    X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type KYCApplication = {
    id: string
    userId: string
    name: string
    email: string
    submissionDate: string
    documentStatus: "complete" | "partial" | "missing"
    riskLevel: "low" | "medium" | "high"
    verificationStatus: "pending" | "document-check" | "face-check" | "complete"
    daysInQueue: number
}

type ModalType = "approve" | "reject" | "request-docs" | null

export function KYCDetailsPanel({ application, onClose }: { application: KYCApplication; onClose: () => void }) {
    const { toast } = useToast()
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [requestedDocs, setRequestedDocs] = useState("")

    const handleApprove = () => {
        toast({
            title: "KYC Approved",
            description: `${application.name}'s KYC has been approved successfully.`,
        })
        setActiveModal(null)
        onClose()
    }

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            })
            return
        }
        toast({
            title: "KYC Rejected",
            description: `${application.name}'s KYC has been rejected.`,
            variant: "destructive",
        })
        setActiveModal(null)
        setRejectionReason("")
        onClose()
    }

    const handleRequestDocs = () => {
        if (!requestedDocs.trim()) {
            toast({
                title: "Error",
                description: "Please specify which documents are required.",
                variant: "destructive",
            })
            return
        }
        toast({
            title: "Document Request Sent",
            description: `${application.name} will be notified about missing documents.`,
        })
        setActiveModal(null)
        setRequestedDocs("")
    }

    const handleFlag = () => {
        toast({
            title: "Application Flagged",
            description: "This application has been flagged for further review.",
            variant: "default",
        })
    }

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
                    {/* User Information */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <User className="h-4 w-4" />
                            User Information
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{application.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{application.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID:</span>
                                <span className="font-medium">{application.userId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Submitted:</span>
                                <span className="font-medium">
                                    {new Date(application.submissionDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Document Verification */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <FileText className="h-4 w-4" />
                            Document Verification
                        </div>

                        {/* Government ID */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Government ID</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div>Type: Passport</div>
                                <div>Number: P8472****</div>
                                <div>Expiry: 12/2030</div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        {/* Facial Recognition */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Facial Recognition</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Match confidence: 98.7%
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                </Button>
                            </div>
                        </div>

                        {/* Address Verification */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Address Verification</span>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div>Type: Utility Bill</div>
                                <div>Date: 2025-09-15</div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Compliance Checks */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Shield className="h-4 w-4" />
                            Compliance Checks
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Sanctions Screening</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">PEP Check</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Adverse Media</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Age Verification</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Risk Assessment */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <AlertCircle className="h-4 w-4" />
                            Risk Assessment
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Overall Risk Level</span>
                                <Badge variant={application.riskLevel === "low" ? "default" : "destructive"}>
                                    {application.riskLevel.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>• Document authenticity: Verified</div>
                                <div>• Geographic risk: Low</div>
                                <div>• Transaction pattern: Normal</div>
                                <div>• Identity confidence: High (98%)</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Activity Log */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Calendar className="h-4 w-4" />
                            Activity Timeline
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">Oct 8, 10:30</div>
                                <div>KYC submitted</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">Oct 8, 10:45</div>
                                <div>Documents uploaded</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">Oct 8, 11:00</div>
                                <div>Automated checks completed</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">Oct 8, 11:15</div>
                                <div>Pending manual review</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
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
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setActiveModal("request-docs")}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Request Documents
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleFlag}>
                            <Flag className="mr-2 h-4 w-4" />
                            Flag for Review
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Approval Modal */}
            <Dialog open={activeModal === "approve"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve KYC Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this KYC application for {application.name}?
                            This action will grant them full access to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
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
                            Please provide a reason for rejecting this application. The user will be notified.
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
                        <Button variant="outline" onClick={() => setActiveModal(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Documents Modal */}
            <Dialog open={activeModal === "request-docs"} onOpenChange={() => setActiveModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Additional Documents</DialogTitle>
                        <DialogDescription>
                            Specify which documents are required from the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="requested-docs">Required Documents</Label>
                        <Textarea
                            id="requested-docs"
                            placeholder="List the documents needed..."
                            value={requestedDocs}
                            onChange={(e) => setRequestedDocs(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRequestDocs}>Send Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
