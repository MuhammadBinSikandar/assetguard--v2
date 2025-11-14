"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateListingDialogProps {
    onCreateListing: (listing: any) => void
}

export function CreateListingDialog({ onCreateListing }: CreateListingDialogProps) {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        price: "",
        type: "Residential" as "Residential" | "Commercial" | "Land",
        size: "",
        roi: "",
        description: "",
        bedrooms: "",
        bathrooms: "",
        yearBuilt: "",
        features: "",
        amenities: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.location || !formData.price || !formData.size) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        const newListing = {
            id: `l${Date.now()}`,
            title: formData.title,
            location: formData.location,
            price: parseFloat(formData.price),
            verified: false,
            type: formData.type,
            size: formData.size,
            roi: parseFloat(formData.roi) || 0,
            progress: 0,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
            description: formData.description,
            bedrooms: parseInt(formData.bedrooms) || 0,
            bathrooms: parseInt(formData.bathrooms) || 0,
            yearBuilt: parseInt(formData.yearBuilt) || 0,
            features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
            amenities: formData.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        }

        onCreateListing(newListing)
        setOpen(false)
        setFormData({
            title: "",
            location: "",
            price: "",
            type: "Residential",
            size: "",
            roi: "",
            description: "",
            bedrooms: "",
            bathrooms: "",
            yearBuilt: "",
            features: "",
            amenities: "",
        })

        toast({
            title: "Listing Created",
            description: "Your property listing has been submitted for review.",
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Listing
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Property Listing</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to list your property or property tokens for sale on the marketplace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Property Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Marina View Residence"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">
                                    Location <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Dubai Marina"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Price (USD) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="125000"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">
                                    Property Type <span className="text-destructive">*</span>
                                </Label>
                                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Residential">Residential</SelectItem>
                                        <SelectItem value="Commercial">Commercial</SelectItem>
                                        <SelectItem value="Land">Land</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="size">
                                    Size <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="size"
                                    placeholder="e.g., 1,200 sqft or 5 acres"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="roi">Expected ROI (%)</Label>
                                <Input
                                    id="roi"
                                    type="number"
                                    step="0.1"
                                    placeholder="6.2"
                                    value={formData.roi}
                                    onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="bedrooms">Bedrooms</Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    placeholder="3"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    placeholder="2"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="yearBuilt">Year Built</Label>
                                <Input
                                    id="yearBuilt"
                                    type="number"
                                    placeholder="2019"
                                    value={formData.yearBuilt}
                                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide a detailed description of your property..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="features">Key Features</Label>
                            <Input
                                id="features"
                                placeholder="Waterfront views, Smart home, Parking (comma-separated)"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Separate features with commas</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amenities">Amenities</Label>
                            <Input
                                id="amenities"
                                placeholder="Pool, Gym, 24/7 Security, Concierge (comma-separated)"
                                value={formData.amenities}
                                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Separate amenities with commas</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Listing</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
