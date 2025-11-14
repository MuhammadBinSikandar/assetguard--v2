"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/components/ui/use-mobile"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { PropertyBreadcrumbs } from "@/components/property-details/breadcrumbs"
import { PropertyGallery } from "@/components/property-details/gallery"
import { PropertyStickyCard } from "@/components/property-details/sticky-card"
import { PropertyTabs } from "@/components/property-details/tabs"
import { SimilarProperties } from "@/components/property-details/similar-carousel"

type Property = {
  id: string
  title: string
  location: string
  price: number
  verified: boolean
  type: "Residential" | "Commercial" | "Land"
  size: string
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  roi: number
  progress: number
  images: string[]
  description: string
  features: string[]
  amenities: string[]
  neighborhood: string
  image?: string
}

const PROPERTIES: Property[] = [
  {
    id: "p1",
    title: "Marina View Residence",
    location: "Dubai Marina",
    price: 125000,
    verified: true,
    type: "Residential",
    size: "1,200 sqft",
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2019,
    roi: 6.2,
    progress: 72,
    images: [
      "/modern-property-exterior.png",
      "/interior-property-living-room.jpg",
      "/marina-residence-kitchen.jpg",
      "/marina-residence-bedroom.jpg",
    ],
    description:
      "A contemporary waterfront apartment offering panoramic marina views, premium finishes, and access to world-class amenities.",
    features: ["Waterfront views", "Floor-to-ceiling windows", "Energy-efficient systems", "Smart access control"],
    amenities: ["24/7 Security", "Gym", "Pool", "Covered Parking", "Concierge"],
    neighborhood:
      "Situated within Dubai Marina with immediate access to cafes, retail, and public transport. High demand for rentals.",
  },
  {
    id: "p2",
    title: "Downtown Offices A",
    location: "Dubai Downtown",
    price: 420000,
    verified: true,
    type: "Commercial",
    size: "9,500 sqft",
    bedrooms: 0,
    bathrooms: 4,
    yearBuilt: 2015,
    roi: 7.1,
    progress: 45,
    images: ["/downtown-offices-exterior.jpg", "/downtown-offices-lobby.jpg", "/downtown-offices-workspace.jpg"],
    description:
      "Prime office floors in a Class A tower in the city’s financial hub. Strong tenant demand and stable lease terms.",
    features: ["Class A building", "High-speed lifts", "LEED-certified", "Flexible floor plates"],
    amenities: ["24/7 Security", "Cafeteria", "Conference Rooms", "Visitor Parking"],
    neighborhood: "Walking distance to metro and major landmarks. Surrounded by premium dining and hospitality.",
  },
  {
    id: "p3",
    title: "Coastal Land Plot",
    location: "Abu Dhabi",
    price: 98000,
    verified: false,
    type: "Land",
    size: "10 acres",
    bedrooms: 0,
    bathrooms: 0,
    yearBuilt: 0,
    roi: 5.0,
    progress: 15,
    images: ["/abu-dhabi-coastal-land.jpg", "/serene-coastline.png"],
    description: "A strategic coastal parcel suitable for mixed-use development with long-term appreciation potential.",
    features: ["Prime coastal access", "Flexible zoning", "Strong appreciation outlook"],
    amenities: ["Road Access", "Utilities Nearby"],
    neighborhood: "Growing corridor with infrastructure investments and improving connectivity.",
  },
  {
    id: "p4",
    title: "Palm Jumeirah Villa",
    location: "Palm Jumeirah",
    price: 980000,
    verified: true,
    type: "Residential",
    size: "5,800 sqft",
    bedrooms: 5,
    bathrooms: 6,
    yearBuilt: 2018,
    roi: 4.8,
    progress: 10,
    images: ["/palm-jumeirah-villa-exterior.jpg", "/palm-villa-pool.jpg", "/palm-villa-interior.jpg"],
    description: "Luxury beachfront villa with private pool, premium finishes, and direct beach access.",
    features: ["Private pool", "Beach access", "Smart home systems", "Premium finishes"],
    amenities: ["Security", "Private Parking", "Garden", "Maid’s Room"],
    neighborhood: "Exclusive community with top-tier dining, retail, and leisure.",
  },
]

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()

  const property = useMemo(() => PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0], [id])

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          <PropertyBreadcrumbs title={property.title} />
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="space-y-4">
              <PropertyGallery images={property.images} title={property.title} />
              <PropertyTabs
                property={{
                  title: property.title,
                  description: property.description,
                  features: property.features,
                  amenities: property.amenities,
                  neighborhood: property.neighborhood,
                }}
              />
              <SimilarProperties />
            </section>

            <aside className="lg:sticky lg:top-20 lg:h-fit">
              <PropertyStickyCard
                property={{
                  id: property.id,
                  title: property.title,
                  location: property.location,
                  price: property.price,
                  verified: property.verified,
                  size: property.size,
                  bedrooms: property.bedrooms ?? 0,
                  bathrooms: property.bathrooms ?? 0,
                  yearBuilt: property.yearBuilt ?? 0,
                  roi: property.roi,
                  image: property.images?.[0] || "/modern-house-exterior.png",
                }}
              />
            </aside>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
