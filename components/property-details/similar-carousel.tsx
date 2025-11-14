"use client"

import { PropertyCard } from "@/components/properties/property-card"

const similar = [
  {
    id: "p2",
    title: "Downtown Offices A",
    location: "Dubai Downtown",
    price: 420000,
    verified: true,
    type: "Commercial" as const,
    size: "9,500 sqft",
    roi: 7.1,
    progress: 45,
  },
  {
    id: "p3",
    title: "Coastal Land Plot",
    location: "Abu Dhabi",
    price: 98000,
    verified: false,
    type: "Land" as const,
    size: "10 acres",
    roi: 5.0,
    progress: 15,
  },
  {
    id: "p4",
    title: "Palm Jumeirah Villa",
    location: "Palm Jumeirah",
    price: 980000,
    verified: true,
    type: "Residential" as const,
    size: "5,800 sqft",
    roi: 4.8,
    progress: 10,
  },
]

export function SimilarProperties() {
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Similar Properties</h3>
        <a href="/properties" className="text-sm text-primary underline-offset-4 hover:underline">
          View More
        </a>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
        {similar.map((p) => (
          <PropertyCard key={p.id} p={p as any} />
        ))}
      </div>
    </section>
  )
}
