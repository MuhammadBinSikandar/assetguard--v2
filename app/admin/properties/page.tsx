"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopBar } from "@/components/admin/admin-topbar"
import { Badge } from "@/components/ui/badge"
import { PropertyApprovalsTab } from "@/components/admin/property-approvals-tab"

export default function PropertyApprovalsPage() {
    const isMobile = useIsMobile()

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <AdminSidebar />
            <SidebarInset className="min-h-svh">
                <AdminTopBar />
                <main className="px-4 pb-10 pt-4 md:px-6">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-semibold">Property Approvals</h1>
                            <Badge variant="destructive" className="font-semibold">ADMIN</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Review and approve property listing submissions
                        </p>
                    </div>

                    {/* Property Approvals Content */}
                    <PropertyApprovalsTab />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
