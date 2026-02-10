"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useClientLogger } from "@/hooks/useClientLogger"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopBar } from "@/components/admin/admin-topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, FileText, TrendingUp, Activity, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminPanel() {
    const isMobile = useIsMobile()
    const router = useRouter()
    const logger = useClientLogger()

    const [stats, setStats] = useState({
        pendingKYC: 0,
        pendingProperties: 0,
        todayApprovals: 0,
        systemHealth: "online" as const,
        loading: true,
    })

    const [authState, setAuthState] = useState({
        loading: true,
        authenticated: false,
        isAdmin: false,
        user: null as any,
    })

    useEffect(() => {
        logger.logComponentMount('AdminPanel');
        
        async function checkAuth() {
            logger.logApiCall('GET', '/api/auth/me');
            
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                
                logger.logApiResponse('GET', '/api/auth/me', response.status, data.success, data);
                
                if (!data.success || !data.data?.user) {
                    logger.logAuthCheck(false);
                    logger.logRedirect('/admin', '/login', 'Not authenticated');
                    router.push('/login?next=/admin');
                    return;
                }

                const user = data.data.user;
                const isAdmin = user.roles?.includes('admin');
                
                logger.logAuthCheck(true, user.roles);
                logger.logRoleCheck(['admin'], user.roles || [], isAdmin);

                if (!isAdmin) {
                    logger.logRedirect('/admin', '/dashboard', 'Not an admin');
                    router.push('/dashboard?error=unauthorized');
                    return;
                }

                setAuthState({
                    loading: false,
                    authenticated: true,
                    isAdmin: true,
                    user,
                });
            } catch (error) {
                logger.logError('Failed to check auth', { error: error instanceof Error ? error.message : 'Unknown error' });
                logger.logRedirect('/admin', '/login', 'Auth check failed');
                router.push('/login?next=/admin');
            }
        }

        checkAuth();
    }, [router, logger]);

    useEffect(() => {
        if (!authState.loading && authState.authenticated && authState.isAdmin) {
            async function fetchStats() {
                logger.logApiCall('GET', '/api/kyc/review');
                
                try {
                    // Fetch pending KYC count
                    const res = await fetch("/api/kyc/review?status=PENDING&limit=1")
                    const json = await res.json()
                    
                    logger.logApiResponse('GET', '/api/kyc/review', res.status, json.success, json);
                    
                    if (json.success) {
                        setStats((prev) => ({
                            ...prev,
                            pendingKYC: json.meta.total,
                            loading: false,
                        }))
                    } else {
                        setStats((prev) => ({ ...prev, loading: false }))
                    }
                } catch (error) {
                    logger.logError('Failed to fetch stats', { error: error instanceof Error ? error.message : 'Unknown error' });
                    setStats((prev) => ({ ...prev, loading: false }))
                }
            }
            fetchStats()
        }
    }, [authState, logger])

    // Show loading state while checking auth
    if (authState.loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Don't render admin panel if not authenticated or not admin
    if (!authState.authenticated || !authState.isAdmin) {
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
