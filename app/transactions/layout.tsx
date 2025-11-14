"use client"

import type { ReactNode } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { useIsMobile } from "@/hooks/use-mobile"

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
