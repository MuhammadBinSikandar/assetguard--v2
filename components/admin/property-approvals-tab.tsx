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
    Building2,
} from "lucide-react"
import { PropertyDetailsPanel } from "@/components/admin/property-details-panel"

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

const mockPropertyApplications: PropertyApplication[] = [
    {
        id: "PROP001",
        propertyId: "P-2024-1001",
        title: "Marina View Residence",
        location: "Dubai Marina, Dubai, UAE",
        submissionDate: "2025-10-08T10:30:00Z",
        documentStatus: "complete",
        verificationStatus: "pending",
        price: 2500000,
        type: "Residential",
        ownerName: "John Doe",
        ownerEmail: "john.doe@example.com",
        daysInQueue: 2,
    },
    {
        id: "PROP002",
        propertyId: "P-2024-1002",
        title: "Downtown Office Complex",
        location: "Downtown Dubai, UAE",
        submissionDate: "2025-10-07T14:20:00Z",
        documentStatus: "partial",
        verificationStatus: "document-check",
        price: 15000000,
        type: "Commercial",
        ownerName: "Jane Smith",
        ownerEmail: "jane.smith@example.com",
        daysInQueue: 3,
    },
    {
        id: "PROP003",
        propertyId: "P-2024-1003",
        title: "Palm Jumeirah Villa",
        location: "Palm Jumeirah, Dubai, UAE",
        submissionDate: "2025-10-05T09:15:00Z",
        documentStatus: "complete",
        verificationStatus: "valuation",
        price: 8500000,
        type: "Residential",
        ownerName: "Robert Johnson",
        ownerEmail: "robert.j@example.com",
        daysInQueue: 5,
    },
]

export function PropertyApprovalsTab() {
    const [selectedProperty, setSelectedProperty] = useState<PropertyApplication | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [searchBy, setSearchBy] = useState("title")
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

    const getVerificationBadgeColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
            case "document-check":
                return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
            case "valuation":
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(price)
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
                                        <RadioGroupItem value="title" id="title" />
                                        <Label htmlFor="title" className="text-sm cursor-pointer">Property Title</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="location" id="location" />
                                        <Label htmlFor="location" className="text-sm cursor-pointer">Location</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="propertyId" id="propertyId" />
                                        <Label htmlFor="propertyId" className="text-sm cursor-pointer">Property ID</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="owner" id="owner" />
                                        <Label htmlFor="owner" className="text-sm cursor-pointer">Owner Name</Label>
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
                                        <Checkbox id="pending-prop" defaultChecked />
                                        <Label htmlFor="pending-prop" className="text-sm cursor-pointer">Pending Review</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="approved-prop" />
                                        <Label htmlFor="approved-prop" className="text-sm cursor-pointer">Approved</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="rejected-prop" />
                                        <Label htmlFor="rejected-prop" className="text-sm cursor-pointer">Rejected</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Property Type */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Property Type</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="residential" />
                                        <Label htmlFor="residential" className="text-sm cursor-pointer">Residential</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="commercial" />
                                        <Label htmlFor="commercial" className="text-sm cursor-pointer">Commercial</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="land" />
                                        <Label htmlFor="land" className="text-sm cursor-pointer">Land</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="mixed" />
                                        <Label htmlFor="mixed" className="text-sm cursor-pointer">Mixed Use</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Document Status */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Document Status</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="all-docs-prop" />
                                        <Label htmlFor="all-docs-prop" className="text-sm cursor-pointer">All documents present</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="missing-docs-prop" />
                                        <Label htmlFor="missing-docs-prop" className="text-sm cursor-pointer">Missing documents</Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Price Range */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Price Range</Label>
                                <Select defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All prices</SelectItem>
                                        <SelectItem value="0-1m">$0 - $1M</SelectItem>
                                        <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                                        <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                                        <SelectItem value="10m+">$10M+</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        <SelectItem value="price-desc">Price (high to low)</SelectItem>
                                        <SelectItem value="price-asc">Price (low to high)</SelectItem>
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

            {/* Main Area - Property Queue */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Property Approval Queue</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                Showing {mockPropertyApplications.length} properties
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
                            {mockPropertyApplications.map((property) => (
                                <div
                                    key={property.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedProperty?.id === property.id ? "bg-primary/5 border-primary" : ""
                                        }`}
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
                                                        <p className="font-semibold">{property.title}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{property.location}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">ID: {property.propertyId}</p>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {property.type}
                                                    </Badge>
                                                    <span className={`text-xs font-medium ${getDaysColor(property.daysInQueue)}`}>
                                                        {property.daysInQueue}d in queue
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        {getDocumentStatusIcon(property.documentStatus)}
                                                        <span className="capitalize">{property.documentStatus}</span>
                                                    </div>
                                                    <Badge className={`text-xs ${getVerificationBadgeColor(property.verificationStatus)}`}>
                                                        {property.verificationStatus.replace("-", " ")}
                                                    </Badge>
                                                </div>
                                                <span className="font-semibold text-primary">{formatPrice(property.price)}</span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Owner: {property.ownerName}</span>
                                                <span>{new Date(property.submissionDate).toLocaleDateString()}</span>
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
            {selectedProperty ? (
                <PropertyDetailsPanel property={selectedProperty} onClose={() => setSelectedProperty(null)} />
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
