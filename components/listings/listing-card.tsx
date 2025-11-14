"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MapPin, Trash2, Edit, Eye, ShieldCheck } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

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

interface ListingCardProps {
    listing: Listing
    onDelete: (id: string) => void
}

export function ListingCard({ listing, onDelete }: ListingCardProps) {
    const statusColors = {
        active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        sold: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    }

    return (
        <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
            <div className="absolute left-2 top-2 flex items-center gap-2 z-10">
                {listing.verified && (
                    <Badge className="inline-flex items-center gap-1" variant="secondary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                    </Badge>
                )}
                <Badge className={statusColors[listing.status]}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
            </div>

            <div className="aspect-[4/3] w-full bg-muted">
                <img
                    src="/modern-property-exterior.png"
                    alt={`Image of ${listing.title}`}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                />
            </div>

            <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="font-medium line-clamp-1">{listing.title}</div>
                    <div className="text-lg font-semibold whitespace-nowrap">${listing.price.toLocaleString()}</div>
                </div>

                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.location}
                </div>

                <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Tokenization Progress</span>
                        <span>{listing.progress}%</span>
                    </div>
                    <Progress value={listing.progress} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                        <div className="text-xs text-muted-foreground">Size</div>
                        <div className="truncate">{listing.size}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="truncate">{listing.type}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                        <div className="text-emerald-600 truncate">+{listing.roi}%</div>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Listed on {new Date(listing.createdAt).toLocaleDateString()}
                </div>
            </CardContent>

            <CardFooter className="flex items-center gap-2 p-4 pt-0">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/properties/${listing.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </Link>
                </Button>
                <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{listing.title}"? This action cannot be undone and will remove the
                                listing from the marketplace.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(listing.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
