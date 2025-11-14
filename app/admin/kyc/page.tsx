"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopBar } from "@/components/admin/admin-topbar"
import { Badge } from "@/components/ui/badge"
import { KYCApprovalsTab } from "@/components/admin/kyc-approvals-tab"

export default function KYCApprovalsPage() {
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
                            <h1 className="text-2xl font-semibold">KYC Approvals</h1>
                            <Badge variant="destructive" className="font-semibold">ADMIN</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Review and approve user KYC verification submissions
                        </p>
                    </div>

                    {/* KYC Approvals Content */}
                    <KYCApprovalsTab />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
