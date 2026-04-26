"use client"

import { useCallback, useEffect, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/components/ui/use-mobile"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListingCard, type MyListingCard } from "@/components/listings/listing-card"
import { CreateListingDialog } from "@/components/listings/create-listing-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Store, CheckCircle2, PackageX, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ListingStatus } from "@prisma/client"

export default function ListingsPage() {
    const isMobile = useIsMobile()
    const { toast } = useToast()
    const [listings, setListings] = useState<MyListingCard[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/listings/my-listings", { credentials: "include" })
            if (!res.ok) {
                toast({ title: "Error", description: "Could not load your listings.", variant: "destructive" })
                return
            }
            const json = await res.json()
            if (json.success) setListings(json.data)
        } catch {
            toast({ title: "Error", description: "Could not load your listings.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        void load()
    }, [load])

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" })
            const json = await res.json()
            if (!res.ok) {
                toast({
                    title: "Delete failed",
                    description: json.message || "Please try again.",
                    variant: "destructive",
                })
                return
            }
            setListings((prev) => prev.filter((l) => l.id !== id))
            toast({ title: "Listing removed", description: "The listing is no longer on the marketplace." })
        } catch {
            toast({ title: "Error", description: "Network error.", variant: "destructive" })
        }
    }

    const handleBookmarkChange = (id: string, bookmarked: boolean) => {
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, bookmarked } : l)))
    }

    const activeListings = listings.filter((l) => l.status === ListingStatus.ACTIVE)
    const soldListings = listings.filter((l) => l.status === ListingStatus.SOLD)

    if (loading) {
        return (
            <SidebarProvider defaultOpen={!isMobile}>
                <DashboardSidebar />
                <SidebarInset className="min-h-svh">
                    <TopBar />
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

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
                        <CreateListingDialog onSuccess={load} />
                    </div>

                    <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
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
                        <TabsList className="grid w-full max-w-xl grid-cols-3">
                            <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
                            <TabsTrigger value="active">Active ({activeListings.length})</TabsTrigger>
                            <TabsTrigger value="sold">Sold ({soldListings.length})</TabsTrigger>
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
                                            Create a listing for an approved, minted property to offer tokens on the marketplace.
                                        </p>
                                        <CreateListingDialog onSuccess={load} />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {listings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onDelete={handleDelete}
                                            onBookmarkChange={handleBookmarkChange}
                                            onCustodyCompleted={load}
                                            onListMoreCompleted={load}
                                        />
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
                                            You don&apos;t have any active listings on the marketplace.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeListings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onDelete={handleDelete}
                                            onBookmarkChange={handleBookmarkChange}
                                            onCustodyCompleted={load}
                                            onListMoreCompleted={load}
                                        />
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
                                            You haven&apos;t marked any listings as sold yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {soldListings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onDelete={handleDelete}
                                            onBookmarkChange={handleBookmarkChange}
                                            onCustodyCompleted={load}
                                            onListMoreCompleted={load}
                                        />
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
