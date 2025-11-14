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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/assetguard/theme-toggle"
import {
    LayoutDashboard,
    ShieldCheck,
    Building2,
    Users,
    Settings,
    FileText,
    BarChart3,
    LogOut,
} from "lucide-react"

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "KYC Approvals", href: "/admin/kyc", icon: ShieldCheck, badge: 48 },
    { label: "Property Approvals", href: "/admin/properties", icon: Building2, badge: 23 },
]

export function AdminSidebar() {
    return (
        <>
            <Sidebar collapsible="icon" variant="sidebar" className="border-r">
                <SidebarHeader>
                    <Link href="/admin" className="flex items-center gap-2 px-2 py-1.5">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V7l-10-5z" />
                            </svg>
                        </span>
                        <div className="flex flex-col">
                            <span className="font-semibold tracking-tight">Admin Panel</span>
                            <Badge variant="destructive" className="text-[10px] w-fit">ADMIN</Badge>
                        </div>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild tooltip={item.label}>
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                                {item.badge && (
                                                    <Badge className="ml-auto" variant="secondary">
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarSeparator />

                <SidebarFooter>
                    <Button
                        className="w-full justify-start gap-2"
                        variant="ghost"
                        asChild
                    >
                        <Link href="/login">
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </Link>
                    </Button>

                    <div className="flex items-center justify-between gap-2">
                        <ThemeToggle />
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarRail />
        </>
    )
}
