"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)

  return (
    <section aria-label="Property gallery" className="space-y-3">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted">
        <img
          src={images[active] || "/placeholder.svg?height=600&width=900&query=property%20image"}
          alt={`${title} image ${active + 1}`}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-24 overflow-hidden rounded border ${i === active ? "ring-2 ring-primary" : "ring-0"}`}
              aria-label={`Show image ${i + 1}`}
            >
              <img
                src={src || "/placeholder.svg?height=120&width=180&query=thumbnail"}
                alt={`${title} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            </button>
          ))}
        </div>

        <Dialog>
          <DialogTrigger className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Full-screen</DialogTrigger>
          <DialogContent className="max-w-4xl">
            <img
              src={images[active] || "/placeholder.svg?height=800&width=1200&query=property%20image%20fullscreen"}
              alt={`${title} full-screen image`}
              className="h-auto w-full rounded object-cover"
              crossOrigin="anonymous"
            />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
