"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Search,
    RotateCcw,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Loader2,
    RefreshCw,
} from "lucide-react"
import { KYCDetailsPanel } from "@/components/admin/kyc-details-panel"
import { useToast } from "@/hooks/use-toast"

// ── Types matching the API response ──────────────────────────────────────────

export type KYCApplication = {
    id: string
    userId: string
    fullName: string
    idNumber: string
    /** Pinata CIDs (private files); admins resolve via GET /api/admin/kyc-document */
    documentUrls: string[]
    submittedAt: string
    reviewedAt: string | null
    reviewedBy: string | null
    adminNotes: string | null
    user: {
        id: string
        email: string
        name: string | null
        kycStatus: "IDLE" | "PENDING" | "APPROVED" | "REJECTED"
    }
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

// ── Component ────────────────────────────────────────────────────────────────

export function KYCApprovalsTab() {
    const { toast } = useToast()
    const [applications, setApplications] = useState<KYCApplication[]>([])
    const [selectedKYC, setSelectedKYC] = useState<KYCApplication | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
    const [showFilters, setShowFilters] = useState(true)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [bulkLoading, setBulkLoading] = useState(false)

    // ── Fetch KYC applications from the API ──────────────────────────────────

    const fetchApplications = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" })
            if (statusFilter !== "ALL") {
                params.set("status", statusFilter)
            }

            const res = await fetch(`/api/kyc/review?${params.toString()}`, {
                credentials: "include",
            })
            const json = await res.json()

            if (json.success) {
                setApplications(json.data)
                setTotalPages(json.meta.totalPages)
                setTotal(json.meta.total)
            } else {
                toast({ title: "Error", description: json.message, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to load KYC applications.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, toast])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    // ── Bulk approve / reject ────────────────────────────────────────────────

    const handleBulkAction = async (status: "APPROVED" | "REJECTED") => {
        if (selectedItems.length === 0) return
        setBulkLoading(true)

        let successCount = 0
        for (const userId of selectedItems) {
            try {
                const res = await fetch("/api/kyc/review", {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, status }),
                })
                const json = await res.json()
                if (json.success) successCount++
            } catch {
                /* skip individual failures */
            }
        }

        toast({
            title: `Bulk ${status.toLowerCase()}`,
            description: `${successCount} of ${selectedItems.length} applications ${status.toLowerCase()}.`,
        })
        setSelectedItems([])
        setBulkLoading(false)
        fetchApplications()
    }

    // ── Client-side search filter ────────────────────────────────────────────

    const filteredApps = applications.filter((app) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            app.fullName.toLowerCase().includes(q) ||
            app.user.email.toLowerCase().includes(q) ||
            app.userId.toLowerCase().includes(q)
        )
    })

    // ── Helpers ──────────────────────────────────────────────────────────────

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">PENDING</Badge>
            case "APPROVED":
                return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">APPROVED</Badge>
            case "REJECTED":
                return <Badge variant="destructive" className="text-xs">REJECTED</Badge>
            default:
                return <Badge variant="secondary" className="text-xs">{status}</Badge>
        }
    }

    const getDaysInQueue = (submittedAt: string) => {
        const days = Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        return days
    }

    const getDaysColor = (days: number) => {
        if (days < 7) return "text-emerald-600"
        if (days <= 14) return "text-yellow-600"
        return "text-destructive"
    }

    // ── Render ───────────────────────────────────────────────────────────────

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
                            {/* Search */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Search</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Name, email, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button size="icon" variant="secondary">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Status Filter */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(val) => {
                                        setStatusFilter(val as StatusFilter)
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        <SelectItem value="PENDING">Pending Review</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="space-y-2 pt-2">
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setStatusFilter("PENDING")
                                        setPage(1)
                                    }}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Filters
                                </Button>
                                <Button className="w-full" variant="secondary" onClick={fetchApplications}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh Data
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
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    `Showing ${filteredApps.length} of ${total} applications`
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Bulk Actions */}
                        {selectedItems.length > 0 && (
                            <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">{selectedItems.length} selected</span>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="ml-auto bg-emerald-600 hover:bg-emerald-700"
                                    disabled={bulkLoading}
                                    onClick={() => handleBulkAction("APPROVED")}
                                >
                                    {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Approve Selected
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={bulkLoading}
                                    onClick={() => handleBulkAction("REJECTED")}
                                >
                                    Reject Selected
                                </Button>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && filteredApps.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? "No applications match your search."
                                        : "No KYC applications found for this status."}
                                </p>
                            </div>
                        )}

                        {/* Application List */}
                        {!loading && (
                            <div className="space-y-2">
                                {filteredApps.map((app) => {
                                    const daysInQueue = getDaysInQueue(app.submittedAt)
                                    return (
                                        <div
                                            key={app.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedKYC?.id === app.id ? "bg-primary/5 border-primary" : ""
                                                }`}
                                            onClick={() => setSelectedKYC(app)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedItems.includes(app.userId)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedItems([...selectedItems, app.userId])
                                                        } else {
                                                            setSelectedItems(selectedItems.filter((id) => id !== app.userId))
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold">{app.fullName}</p>
                                                            <p className="text-sm text-muted-foreground">{app.user.email}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                ID No: {app.idNumber}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-1 items-end">
                                                            {getStatusBadge(app.user.kycStatus)}
                                                            <span className={`text-xs font-medium ${getDaysColor(daysInQueue)}`}>
                                                                {daysInQueue}d in queue
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            {app.documentUrls.length > 0 ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                            ) : (
                                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                            )}
                                                            <span>{app.documentUrls.length} doc(s)</span>
                                                        </div>
                                                        <span className="text-muted-foreground ml-auto">
                                                            {new Date(app.submittedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar - Details Panel */}
            {selectedKYC ? (
                <KYCDetailsPanel
                    application={selectedKYC}
                    onClose={() => setSelectedKYC(null)}
                    onActionComplete={fetchApplications}
                />
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
