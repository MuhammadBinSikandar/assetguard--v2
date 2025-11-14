"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Search,
    Filter,
    Download,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { KYCDetailsPanel } from "@/components/admin/kyc-details-panel"

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

const mockKYCApplications: KYCApplication[] = [
    {
        id: "KYC001",
        userId: "USR-2024-1001",
        name: "John Doe",
        email: "john.doe@example.com",
        submissionDate: "2025-10-08T10:30:00Z",
        documentStatus: "complete",
        riskLevel: "low",
        verificationStatus: "pending",
        daysInQueue: 2,
    },
    {
        id: "KYC002",
        userId: "USR-2024-1002",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        submissionDate: "2025-10-07T14:20:00Z",
        documentStatus: "partial",
        riskLevel: "medium",
        verificationStatus: "document-check",
        daysInQueue: 3,
    },
    {
        id: "KYC003",
        userId: "USR-2024-1003",
        name: "Robert Johnson",
        email: "robert.j@example.com",
        submissionDate: "2025-10-05T09:15:00Z",
        documentStatus: "complete",
        riskLevel: "low",
        verificationStatus: "face-check",
        daysInQueue: 5,
    },
    {
        id: "KYC004",
        userId: "USR-2024-1004",
        name: "Maria Garcia",
        email: "maria.garcia@example.com",
        submissionDate: "2025-09-28T16:45:00Z",
        documentStatus: "missing",
        riskLevel: "high",
        verificationStatus: "pending",
        daysInQueue: 12,
    },
]

export function KYCApprovalsTab() {
    const [selectedKYC, setSelectedKYC] = useState<KYCApplication | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [searchBy, setSearchBy] = useState("email")
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(true)

    const getDocumentStatusIcon = (status: string) => {
        switch (status) {
            case "complete":
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            case "partial":
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />
            case "missing":
                return <XCircle className="h-4 w-4 text-destructive" />
            default:
                return null
        }
    }

    const getRiskBadgeVariant = (risk: string) => {
        switch (risk) {
            case "low":
                return "default"
            case "medium":
                return "secondary"
            case "high":
                return "destructive"
            default:
                return "secondary"
        }
    }

    const getVerificationBadgeColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
            case "document-check":
                return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
            case "face-check":
                return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
            case "complete":
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            default:
                return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
        }
    }

    const getDaysColor = (days: number) => {
        if (days < 7) return "text-emerald-600"
        if (days <= 14) return "text-yellow-600"
        return "text-destructive"
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_380px]">
            {/* Left Sidebar - Filters */}
            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Filters & Search</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent className="space-y-4">
                            {/* Search Section */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Search By</Label>
                                <RadioGroup value={searchBy} onValueChange={setSearchBy}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="email" id="email" />
                                        <Label htmlFor="email" className="text-sm cursor-pointer">Email</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="name" id="name" />
                                        <Label htmlFor="name" className="text-sm cursor-pointer">Name</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="userId" id="userId" />
                                        <Label htmlFor="userId" className="text-sm cursor-pointer">User ID</Label>
                                    </div>
                                </RadioGroup>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder={`Search by ${searchBy}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button size="icon" variant="secondary">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Status Filters */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Status</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="pending" defaultChecked />
                                        <Label htmlFor="pending" className="text-sm cursor-pointer">Pending Review</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="approved" />
                                        <Label htmlFor="approved" className="text-sm cursor-pointer">Approved</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="rejected" />
                                        <Label htmlFor="rejected" className="text-sm cursor-pointer">Rejected</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Document Status */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Document Status</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="all-docs" />
                                        <Label htmlFor="all-docs" className="text-sm cursor-pointer">All documents present</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="missing-docs" />
                                        <Label htmlFor="missing-docs" className="text-sm cursor-pointer">Missing documents</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Risk Level */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Risk Assessment</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="low-risk" />
                                        <Label htmlFor="low-risk" className="text-sm cursor-pointer">Low risk</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="medium-risk" />
                                        <Label htmlFor="medium-risk" className="text-sm cursor-pointer">Medium risk</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="high-risk" />
                                        <Label htmlFor="high-risk" className="text-sm cursor-pointer">High risk</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Sort Options */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Sort By</Label>
                                <Select defaultValue="submission-desc">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="submission-desc">Submission date (newest first)</SelectItem>
                                        <SelectItem value="submission-asc">Submission date (oldest first)</SelectItem>
                                        <SelectItem value="risk">Risk level</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                                <Button className="w-full" variant="default">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Apply Filters
                                </Button>
                                <Button className="w-full" variant="outline">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Filters
                                </Button>
                                <Button className="w-full" variant="secondary">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Results
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Main Area - KYC Queue */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">KYC Applications Queue</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                Showing {mockKYCApplications.length} applications
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Bulk Actions */}
                        {selectedItems.length > 0 && (
                            <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">{selectedItems.length} items selected</span>
                                <Button size="sm" variant="default" className="ml-auto">
                                    Approve Selected
                                </Button>
                                <Button size="sm" variant="destructive">
                                    Reject Selected
                                </Button>
                            </div>
                        )}

                        {/* Table */}
                        <div className="space-y-2">
                            {mockKYCApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedKYC?.id === app.id ? "bg-primary/5 border-primary" : ""
                                        }`}
                                    onClick={() => setSelectedKYC(app)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedItems.includes(app.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedItems([...selectedItems, app.id])
                                                } else {
                                                    setSelectedItems(selectedItems.filter((id) => id !== app.id))
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold">{app.name}</p>
                                                    <p className="text-sm text-muted-foreground">{app.email}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">ID: {app.userId}</p>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <Badge variant={getRiskBadgeVariant(app.riskLevel)} className="text-xs">
                                                        {app.riskLevel.toUpperCase()} RISK
                                                    </Badge>
                                                    <span className={`text-xs font-medium ${getDaysColor(app.daysInQueue)}`}>
                                                        {app.daysInQueue}d in queue
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1">
                                                    {getDocumentStatusIcon(app.documentStatus)}
                                                    <span className="capitalize">{app.documentStatus}</span>
                                                </div>
                                                <Badge className={`text-xs ${getVerificationBadgeColor(app.verificationStatus)}`}>
                                                    {app.verificationStatus.replace("-", " ")}
                                                </Badge>
                                                <span className="text-muted-foreground ml-auto">
                                                    {new Date(app.submissionDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar - Details Panel */}
            {selectedKYC ? (
                <KYCDetailsPanel application={selectedKYC} onClose={() => setSelectedKYC(null)} />
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            Select a KYC application to view details
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
