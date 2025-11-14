"use client"

import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/assetguard/theme-toggle"
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Briefcase,
  Receipt,
  BarChart3,
  Box,
  FilePlus2,
  Settings,
  Bot,
  ExternalLink,
  Store,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Browse Properties", href: "/properties", icon: Building2 },
  { label: "My Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "My Listings", href: "/listings", icon: Store },
  { label: "Investment Opportunities", href: "/opportunities", icon: Box },
  { label: "Transactions", href: "/transactions", icon: Receipt },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Blockchain Explorer", href: "/explorer", icon: Box },
  { label: "Register Property", href: "/register/property", icon: FilePlus2 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Solscan (Devnet)", href: "https://solscan.io/?cluster=devnet", icon: ExternalLink, external: true },
]

export function DashboardSidebar() {
  const { state } = useSidebar()
  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
            <span className="font-semibold tracking-tight">AssetGuard</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={item.href === "/dashboard"} tooltip={item.label}>
                      {item.external ? (
                        <a href={item.href} target="_blank" rel="noreferrer">
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      ) : (
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          {item.label === "Dashboard" && (
                            <Badge className="ml-auto" variant="secondary" aria-hidden>
                              Active
                            </Badge>
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          {/* AI Chatbot Button (floating/pulsing) */}
          <Button
            className="w-full justify-center gap-2 animate-pulse"
            variant="default"
            aria-label="Open AI Chatbot"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("assetguard:chat:toggle"))
              }
            }}
          >
            <Bot className="h-4 w-4" />
            <span className="truncate">AI Chatbot</span>
          </Button>

          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            {/* Collapse hint when expanded */}
            <span className="text-xs text-muted-foreground hidden md:block" aria-hidden={state !== "expanded"}>
              Collapse with ⌘/Ctrl + B
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
    </>
  )
}
