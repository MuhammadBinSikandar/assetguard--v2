"use client"

import Link from "next/link"

export function PropertyBreadcrumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-2 text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/properties" className="hover:text-foreground underline-offset-4 hover:underline">
            Properties
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li className="text-foreground font-medium">{title}</li>
      </ol>
    </nav>
  )
}
