"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const properties = [
  {
    id: "p1",
    name: "Skyline Tower",
    city: "New York, NY",
    img: "/skyline-tower-nyc.jpg",
    apy: "7.2% APY",
    min: "$100 min",
    price: "$1.2M",
    tokenized: 68,
    verified: true,
  },
  {
    id: "p2",
    name: "Harbor Residences",
    city: "San Francisco, CA",
    img: "/harbor-residences-sf.jpg",
    apy: "6.5% APY",
    min: "$100 min",
    price: "$980k",
    tokenized: 52,
    verified: true,
  },
  {
    id: "p3",
    name: "Lakeside Villas",
    city: "Austin, TX",
    img: "/lakeside-villas-austin.jpg",
    apy: "6.9% APY",
    min: "$100 min",
    price: "$760k",
    tokenized: 74,
    verified: true,
  },
  {
    id: "p4",
    name: "Old City Lofts",
    city: "Chicago, IL",
    img: "/old-city-lofts-chicago.jpg",
    apy: "7.0% APY",
    min: "$100 min",
    price: "$640k",
    tokenized: 41,
    verified: false,
  },
]

export function PropertyCarousel() {
  const [index, setIndex] = useState(0)

  const prev = () => setIndex((i) => (i - 1 + properties.length) % properties.length)
  const next = () => setIndex((i) => (i + 1) % properties.length)

  const visible = [
    properties[index],
    properties[(index + 1) % properties.length],
    properties[(index + 2) % properties.length],
  ]

  return (
    <section id="properties" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-6">
      <div className="flex items-center justify-between">
        <div className="max-w-xl">
          <h2 className="text-4xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {"Featured properties"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {"Diversify across geographies and strategies with curated, tokenized assets."}
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button variant="outline" onClick={prev} aria-label="Previous properties">
            Prev
          </Button>
          <Button variant="outline" onClick={next} aria-label="Next properties">
            Next
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <article key={p.id} className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="relative h-44 w-full">
              <Image src={p.img || "/placeholder.svg"} alt={`${p.name} preview`} fill className="object-cover" />
              {/* verified badge */}
              {p.verified && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-xs text-primary-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9 12l2 2 4-4 1.5 1.5L11 17l-3.5-3.5L9 12z" />
                  </svg>
                  Verified
                </span>
              )}
              {/* bookmark icon */}
              <button
                aria-label="Bookmark"
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1 hover:bg-background"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-foreground"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">{p.apy}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  {p.city}
                </span>
                <span>{p.price}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tokenized</span>
                  <span>{p.tokenized}%</span>
                </div>
                <Progress value={p.tokenized} className="mt-1" />
              </div>
              <Button variant="outline" className="mt-3 w-full bg-transparent" asChild>
                <Link href={`/properties/${p.id}`}>View Details</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2 md:hidden">
        <Button variant="outline" onClick={prev} aria-label="Previous properties">
          Prev
        </Button>
        <Button variant="outline" onClick={next} aria-label="Next properties">
          Next
        </Button>
      </div>
    </section>
  )
}
