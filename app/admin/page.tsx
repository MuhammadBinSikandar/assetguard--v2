"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppSelector } from "@/store/redux/store"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopBar } from "@/components/admin/admin-topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, FileText, TrendingUp, Activity, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminPanel() {
    const isMobile = useIsMobile()
    const router = useRouter()

    // Read user state from Redux (already populated by KYCPromptProvider's useAuth)
    const user = useAppSelector((state) => state.user.user)
    const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)
    const authLoading = useAppSelector((state) => state.user.loading)
    const initialFetchDone = useAppSelector((state) => state.user._initialFetchDone)

    const isAdmin = user?.roles?.includes('admin') ?? false

    const [stats, setStats] = useState({
        pendingKYC: 0,
        pendingProperties: 0,
        todayApprovals: 0,
        systemHealth: "online" as const,
        loading: true,
    })

    // Redirect if not authenticated or not admin (only after initial fetch completes)
    useEffect(() => {
        if (authLoading || !initialFetchDone) return // Still loading

        if (!isAuthenticated || !user) {
            router.push('/login?next=/admin')
            return
        }

        if (!isAdmin) {
            router.push('/dashboard?error=unauthorized')
            return
        }

        // Auth confirmed — fetch stats
        async function fetchStats() {
            try {
                const res = await fetch("/api/kyc/review?status=PENDING&limit=1")
                const json = await res.json()
                if (json.success) {
                    setStats((prev) => ({
                        ...prev,
                        pendingKYC: json.meta.total,
                        loading: false,
                    }))
                } else {
                    setStats((prev) => ({ ...prev, loading: false }))
                }
            } catch {
                setStats((prev) => ({ ...prev, loading: false }))
            }
        }
        fetchStats()
    }, [authLoading, initialFetchDone, isAuthenticated, isAdmin, user, router])

    // Show loading state while checking auth
    if (authLoading || !initialFetchDone || !isAuthenticated || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Don't render admin panel if not authenticated or not admin
    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <AdminSidebar />
            <SidebarInset className="min-h-svh">
                <AdminTopBar />
                <main className="px-4 pb-10 pt-4 md:px-6">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-semibold">Admin Panel</h1>
                            <Badge variant="destructive" className="font-semibold">ADMIN</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Manage KYC verifications and property approvals
                        </p>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-blue-500/10 p-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">
                                        {stats.loading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : stats.pendingKYC}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Pending KYC Reviews</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                                        <span className="text-xs text-emerald-600">+12% this week</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-purple-500/10 p-3">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{stats.pendingProperties}</p>
                                    <p className="text-xs text-muted-foreground">Pending Properties</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                                        <span className="text-xs text-emerald-600">+8% this week</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-emerald-500/10 p-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{stats.todayApprovals}</p>
                                    <p className="text-xs text-muted-foreground">Today's Approvals</p>
                                    <p className="text-xs text-muted-foreground mt-1">8 KYC, 7 Properties</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-full bg-emerald-500/10 p-3">
                                    <Activity className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-emerald-600">Online</p>
                                    <p className="text-xs text-muted-foreground">System Health</p>
                                    <p className="text-xs text-muted-foreground mt-1">Last sync: 2 mins ago</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Access Links */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link href="/admin/kyc">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                    <div className="rounded-full bg-blue-500/10 p-4">
                                        <CheckCircle2 className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">KYC Approvals</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Review and approve user KYC submissions
                                        </p>
                                        <Badge variant="secondary" className="text-sm">
                                            {stats.pendingKYC} Pending
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/admin/properties">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                    <div className="rounded-full bg-purple-500/10 p-4">
                                        <FileText className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Property Approvals</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Review and approve property listings
                                        </p>
                                        <Badge variant="secondary" className="text-sm">
                                            {stats.pendingProperties} Pending
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
