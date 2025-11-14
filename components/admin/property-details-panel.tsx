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
    Building2,
    MapPin,
    Calendar,
    Shield,
    Flag,
    MessageSquare,
    Download,
    Eye,
    X,
    DollarSign,
    User,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PropertyApplication = {
    id: string
    propertyId: string
    title: string
    location: string
    submissionDate: string
    documentStatus: "complete" | "partial" | "missing"
    verificationStatus: "pending" | "document-check" | "valuation" | "complete"
    price: number
    type: string
    ownerName: string
    ownerEmail: string
    daysInQueue: number
}

type ModalType = "approve" | "reject" | "request-docs" | null

export function PropertyDetailsPanel({ property, onClose }: { property: PropertyApplication; onClose: () => void }) {
    const { toast } = useToast()
    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [requestedDocs, setRequestedDocs] = useState("")

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(price)
    }

    const handleApprove = () => {
        toast({
            title: "Property Approved",
            description: `${property.title} has been approved for listing.`,
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
            title: "Property Rejected",
            description: `${property.title} has been rejected.`,
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
            description: `${property.ownerName} will be notified about missing documents.`,
        })
        setActiveModal(null)
        setRequestedDocs("")
    }

    const handleFlag = () => {
        toast({
            title: "Property Flagged",
            description: "This property has been flagged for further review.",
            variant: "default",
        })
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
                    {/* Property Information */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Building2 className="h-4 w-4" />
                            Property Information
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Title:</span>
                                <span className="font-medium text-right">{property.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Property ID:</span>
                                <span className="font-medium">{property.propertyId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{property.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium text-right max-w-[60%]">{property.location}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-medium text-primary">{formatPrice(property.price)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Submitted:</span>
                                <span className="font-medium">
                                    {new Date(property.submissionDate).toLocaleDateString()}
                                </span>
                            </div>
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
                                <span className="font-medium">{property.ownerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{property.ownerEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">KYC Status:</span>
                                <Badge variant="default" className="text-xs">
                                    Verified
                                </Badge>
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

                        {/* Title Deed */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Title Deed</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div>Document ID: TD-2024-****</div>
                                <div>Issued: 2023</div>
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

                        {/* Valuation Report */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Valuation Report</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div>Valuator: Global Property Valuers</div>
                                <div>Date: {new Date().toLocaleDateString()}</div>
                                <div>Estimated Value: {formatPrice(property.price)}</div>
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

                        {/* Property Images */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Property Images</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                12 high-resolution images
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Gallery
                                </Button>
                            </div>
                        </div>

                        {/* Floor Plans */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Floor Plans</span>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Quality check pending
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
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
                                <span className="text-muted-foreground">Legal Title Verification</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Ownership Verification</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Property Encumbrances</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Market Value Check</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Regulatory Compliance</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Valuation Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <DollarSign className="h-4 w-4" />
                            Valuation Analysis
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Asking Price</span>
                                <span className="font-medium">{formatPrice(property.price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Market Value</span>
                                <span className="font-medium">{formatPrice(property.price * 0.98)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Price Variance</span>
                                <Badge variant="default" className="text-xs">+2%</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                • Location premium: Average for area<br />
                                • Condition: Excellent<br />
                                • Market trend: Stable<br />
                                • Comparable sales: Within range
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
                                <div className="text-muted-foreground min-w-[80px]">
                                    {new Date(property.submissionDate).toLocaleDateString()}
                                </div>
                                <div>Property submitted</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">
                                    {new Date(property.submissionDate).toLocaleDateString()}
                                </div>
                                <div>Documents uploaded</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">
                                    {new Date(property.submissionDate).toLocaleDateString()}
                                </div>
                                <div>Automated checks completed</div>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <div className="text-muted-foreground min-w-[80px]">
                                    {new Date(property.submissionDate).toLocaleDateString()}
                                </div>
                                <div>Pending admin review</div>
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
                            Approve Property
                        </Button>
                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => setActiveModal("reject")}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Property
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
                        <DialogTitle>Approve Property Listing</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this property for listing? {property.title} will become
                            available for tokenization and investment.
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
                            Specify which documents are required from the property owner.
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
