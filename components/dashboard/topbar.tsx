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
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

export function TopBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
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

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U"
    const names = user.name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Check if user has KYC verified role (you can adjust this logic based on your KYC system)
  const isKYCVerified = user?.roles?.includes('kyc_verified') || false

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
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-flex text-sm">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              {isKYCVerified && (
                <Badge variant="secondary" className="hidden lg:inline-flex gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  KYC
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/wallet')}>
              Wallet
            </DropdownMenuItem>
            {!isKYCVerified && (
              <DropdownMenuItem onClick={() => router.push('/kyc')}>
                Complete KYC
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
