"use client"

import { useState, useEffect, useCallback } from "react"
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
    Building2,
    Loader2,
} from "lucide-react"
import { PropertyDetailsPanel } from "@/components/admin/property-details-panel"
import { AdminVerifiedPriceEditor } from "@/components/admin/admin-verified-price-editor"
import { effectivePropertyValuationUsd } from "@/lib/property-valuation"

export type PropertyApplication = {
    id: string
    referenceId: string
    propertyAddress: string
    ownerName: string
    borough: string
    block: string
    lot: string
    status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
    submittedAt: string
    estimatedPriceUSD: number
    verifiedPriceUSD: number | null
    walletAddress: string
    documentCount: number
}

export function PropertyApprovalsTab() {
    const [properties, setProperties] = useState<PropertyApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProperty, setSelectedProperty] = useState<PropertyApplication | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showFilters, setShowFilters] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchProperties = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set("page", String(page))
            params.set("limit", "20")
            if (statusFilter !== "all") params.set("status", statusFilter)
            if (searchQuery.trim()) params.set("search", searchQuery.trim())

            const res = await fetch(`/api/admin/properties?${params}`, { credentials: "include" })
            if (res.ok) {
                const json = await res.json()
                setProperties(json.data || [])
                setTotalPages(json.totalPages || 1)
                setTotal(json.total || 0)
            }
        } catch (err) {
            console.error("Failed to fetch properties:", err)
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, searchQuery])

    useEffect(() => { fetchProperties() }, [fetchProperties])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">Pending</Badge>
            case "UNDER_REVIEW":
                return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs">Under Review</Badge>
            case "APPROVED":
                return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">Approved</Badge>
            case "REJECTED":
                return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 text-xs">Rejected</Badge>
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(price)
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

    const handlePropertyUpdated = () => {
        fetchProperties()
        setSelectedProperty(null)
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
                            {/* Search */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Search</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Address, ref ID, owner..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button size="icon" variant="secondary" onClick={() => { setPage(1); fetchProperties() }}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Status Filter */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                                <Button className="w-full" variant="outline" onClick={() => {
                                    setSearchQuery(""); setStatusFilter("all"); setPage(1)
                                }}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Filters
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Main Area - Property Queue */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Property Approval Queue</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {loading ? "Loading..." : `Showing ${properties.length} of ${total} properties`}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Bulk Actions */}
                        {selectedItems.length > 0 && (
                            <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">{selectedItems.length} items selected</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : properties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">No properties found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {properties.map((property) => {
                                    const days = getDaysInQueue(property.submittedAt)
                                    return (
                                        <div
                                            key={property.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedProperty?.id === property.id ? "bg-primary/5 border-primary" : ""}`}
                                            onClick={() => setSelectedProperty(property)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedItems.includes(property.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedItems([...selectedItems, property.id])
                                                        } else {
                                                            setSelectedItems(selectedItems.filter((id) => id !== property.id))
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                <p className="font-semibold">{property.propertyAddress}</p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                BBL: {property.borough}-{property.block}-{property.lot}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Ref: {property.referenceId}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-1 items-end">
                                                            {getStatusBadge(property.status)}
                                                            <span className={`text-xs font-medium ${getDaysColor(days)}`}>
                                                                {days}d in queue
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                {property.documentCount > 0 ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                ) : (
                                                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                                )}
                                                                <span>{property.documentCount} doc(s)</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold text-primary block">
                                                                {formatPrice(
                                                                    effectivePropertyValuationUsd(
                                                                        property.estimatedPriceUSD,
                                                                        property.verifiedPriceUSD,
                                                                    ),
                                                                )}
                                                            </span>
                                                            {property.verifiedPriceUSD != null && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Admin verified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>Owner: {property.ownerName}</span>
                                                        <span>{new Date(property.submittedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar - Details Panel */}
            {selectedProperty ? (
                <div className="space-y-4 min-w-0">
                    <AdminVerifiedPriceEditor
                        propertyId={selectedProperty.id}
                        submittedPriceUSD={selectedProperty.estimatedPriceUSD}
                        verifiedPriceUSD={selectedProperty.verifiedPriceUSD}
                        onSaved={({ verifiedPriceUSD }) => {
                            setSelectedProperty({
                                ...selectedProperty,
                                verifiedPriceUSD,
                            })
                            fetchProperties()
                        }}
                    />
                    <PropertyDetailsPanel
                        property={selectedProperty}
                        onClose={() => setSelectedProperty(null)}
                        onPropertyUpdated={handlePropertyUpdated}
                    />
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            Select a property to view details
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
