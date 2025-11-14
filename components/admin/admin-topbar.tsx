"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
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
import { HelpCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"

export function AdminTopBar() {
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <header role="banner" className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
                <SidebarTrigger />

                {/* Admin Badge */}
                <Badge variant="destructive" className="hidden sm:inline-flex">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    ADMIN PANEL
                </Badge>

                {/* Date & Time */}
                <div className="hidden lg:flex flex-col text-xs text-muted-foreground">
                    <span>{currentDate}</span>
                    <span className="font-mono">{currentTime}</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Help Button */}
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/help" aria-label="Help">
                        <HelpCircle className="h-5 w-5" />
                    </Link>
                </Button>

                {/* Admin Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-destructive text-destructive-foreground">
                                    AD
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:inline-flex text-sm">Admin User</span>
                            <Badge variant="destructive" className="hidden lg:inline-flex text-[10px]">
                                SUPER ADMIN
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Admin Settings</DropdownMenuItem>
                        <DropdownMenuItem>Activity Log</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
