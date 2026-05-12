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
            <div className="flex items-center justify-center h-10 w-10">
              <img 
                src="/AG_Token_Logo-removebg-preview.png" 
                alt="AG Logo" 
                className="h-full w-full object-contain"
              />
            </div>
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
