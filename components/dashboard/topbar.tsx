"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, ShieldCheck } from "lucide-react"

export function TopBar() {
  const [recent, setRecent] = React.useState<string[]>([
    "Dubai Marina apartments",
    "Cap rate > 6%",
    "Tokenized office space",
  ])
  const [query, setQuery] = React.useState("")

  const onSearch = (q: string) => {
    if (!q.trim()) return
    setRecent((prev) => [q, ...prev.filter((r) => r !== q)].slice(0, 5))
    setQuery("")
  }

  return (
    <header role="banner" className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <SidebarTrigger />

        {/* Spacer to push items to the right */}
        <div className="flex-1" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] px-1"
          >
            3
          </span>
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-flex text-sm">Alex Green</span>
              <Badge variant="secondary" className="hidden lg:inline-flex gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                KYC
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Wallet</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
