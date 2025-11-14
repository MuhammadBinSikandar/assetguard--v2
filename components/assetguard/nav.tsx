"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-shadow ${scrolled ? "shadow-sm bg-card/80 backdrop-blur" : "bg-transparent"}`}
      role="banner"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="#" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              {/* blockchain icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 2h10a1 1 0 0 1 1 1v5a1 1 0 0 1-.553.894l-5 2.5a1 1 0 0 1-.894 0l-5-2.5A1 1 0 0 1 6 8V3a1 1 0 0 1 1-1Zm-1 9.236 5 2.5a3 3 0 0 0 2.684 0l5-2.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V11.236Z" />
              </svg>
            </span>
            <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              AssetGuard
            </span>
          </Link>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#properties" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Properties
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
