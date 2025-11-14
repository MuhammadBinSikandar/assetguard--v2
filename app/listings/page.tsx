"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/components/ui/use-mobile"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListingCard } from "@/components/listings/listing-card"
import { CreateListingDialog } from "@/components/listings/create-listing-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Store, Clock, CheckCircle2, PackageX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Listing = {
    id: string
    title: string
    location: string
    price: number
    verified: boolean
    type: "Residential" | "Commercial" | "Land"
    size: string
    roi: number
    progress: number
    status: "active" | "pending" | "sold"
    createdAt: string
}

const INITIAL_LISTINGS: Listing[] = [
    {
        id: "l1",
        title: "Harbor Residences SF",
        location: "San Francisco Bay",
        price: 850000,
        verified: true,
        type: "Residential",
        size: "2,400 sqft",
        roi: 5.8,
        progress: 85,
        status: "active",
        createdAt: "2024-12-15",
    },
    {
        id: "l2",
        title: "Tech Park Office Space",
        location: "Austin, TX",
        price: 320000,
        verified: true,
        type: "Commercial",
        size: "4,500 sqft",
        roi: 7.5,
        progress: 60,
        status: "active",
        createdAt: "2024-12-20",
    },
    {
        id: "l3",
        title: "Lakeside Development Plot",
        location: "Lake Travis",
        price: 175000,
        verified: false,
        type: "Land",
        size: "8 acres",
        roi: 4.2,
        progress: 20,
        status: "pending",
        createdAt: "2025-01-05",
    },
]

export default function ListingsPage() {
    const isMobile = useIsMobile()
    const { toast } = useToast()
    const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS)

    const handleCreateListing = (newListing: Listing) => {
        setListings((prev) => [newListing, ...prev])
    }

    const handleDeleteListing = (id: string) => {
        setListings((prev) => prev.filter((listing) => listing.id !== id))
        toast({
            title: "Listing Deleted",
            description: "The listing has been removed from the marketplace.",
        })
    }

    const activeListings = listings.filter((l) => l.status === "active")
    const pendingListings = listings.filter((l) => l.status === "pending")
    const soldListings = listings.filter((l) => l.status === "sold")

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <DashboardSidebar />
            <SidebarInset className="min-h-svh">
                <TopBar />
                <main className="px-4 pb-10 pt-4 md:px-6">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold mb-1">My Listings</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your property and token listings on the marketplace
                            </p>
                        </div>
                        <CreateListingDialog onCreateListing={handleCreateListing} />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-emerald-500/10 p-2">
                                    <Store className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{listings.length}</p>
                                    <p className="text-xs text-muted-foreground">Total Listings</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-blue-500/10 p-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{activeListings.length}</p>
                                    <p className="text-xs text-muted-foreground">Active</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-yellow-500/10 p-2">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{pendingListings.length}</p>
                                    <p className="text-xs text-muted-foreground">Pending Review</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-gray-500/10 p-2">
                                    <PackageX className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{soldListings.length}</p>
                                    <p className="text-xs text-muted-foreground">Sold</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="grid w-full max-w-2xl grid-cols-4">
                            <TabsTrigger value="all">
                                All ({listings.length})
                            </TabsTrigger>
                            <TabsTrigger value="active">
                                Active ({activeListings.length})
                            </TabsTrigger>
                            <TabsTrigger value="pending">
                                Pending ({pendingListings.length})
                            </TabsTrigger>
                            <TabsTrigger value="sold">
                                Sold ({soldListings.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {listings.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="mb-4 rounded-full bg-muted p-4">
                                            <Store className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">No Listings Yet</h3>
                                        <p className="text-center text-sm text-muted-foreground max-w-sm mb-4">
                                            Create your first property listing to start selling on the marketplace.
                                        </p>
                                        <CreateListingDialog onCreateListing={handleCreateListing} />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {listings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} onDelete={handleDeleteListing} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="active">
                            {activeListings.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="mb-4 rounded-full bg-muted p-4">
                                            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">No Active Listings</h3>
                                        <p className="text-center text-sm text-muted-foreground max-w-sm">
                                            You don't have any active listings on the marketplace.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeListings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} onDelete={handleDeleteListing} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending">
                            {pendingListings.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="mb-4 rounded-full bg-muted p-4">
                                            <Clock className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">No Pending Listings</h3>
                                        <p className="text-center text-sm text-muted-foreground max-w-sm">
                                            You don't have any listings pending review.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pendingListings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} onDelete={handleDeleteListing} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="sold">
                            {soldListings.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="mb-4 rounded-full bg-muted p-4">
                                            <PackageX className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">No Sold Listings</h3>
                                        <p className="text-center text-sm text-muted-foreground max-w-sm">
                                            You haven't sold any listings yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {soldListings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} onDelete={handleDeleteListing} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
