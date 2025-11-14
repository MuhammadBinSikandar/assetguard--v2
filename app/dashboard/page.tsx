"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { MetricCard } from "@/components/dashboard/metric-card"
{/* import { QuickActions } from "@/components/dashboard/quick-actions" */}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/components/ui/use-mobile"

export default function DashboardPage() {
  // Mock data for metric cards (replace with real data later)
  const portfolioTrend = [120, 128, 126, 134, 142, 139, 148, 152, 158, 161]
  const investmentsTrend = [12, 12, 13, 13, 14, 15, 15, 16, 17, 17]
  const propertiesTrend = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6]
  const balanceTrend = [8.2, 8.3, 8.25, 8.5, 8.6, 8.55, 8.7, 8.9, 9.1, 9.2]

  const isMobile = useIsMobile()

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          {/* Row 1 - Key Metrics */}
          <section aria-labelledby="key-metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <h2 id="key-metrics" className="sr-only">
              Key Metrics
            </h2>

            <MetricCard
              title="Total Portfolio Value"
              value="$161,000"
              delta="+4.1%"
              trend={portfolioTrend}
              colorVar="--chart-1"
              valueHint="as of today"
            />

            <MetricCard
              title="Total Investments"
              value="17"
              delta="+1"
              trend={investmentsTrend}
              colorVar="--chart-2"
              valueHint="active positions"
            />

            <MetricCard
              title="Properties Owned"
              value="6"
              delta="+1 fractional"
              trend={propertiesTrend}
              colorVar="--chart-3"
              valueHint="full + fractional"
            />

            <MetricCard
              title="Available Balance"
              value="$9,200"
              delta="+$300"
              trend={balanceTrend}
              colorVar="--chart-4"
              valueHint="wallet balance"
            />
          </section>

          {/* Example additional content grid (placeholder) */}
          <section aria-labelledby="overview" className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <h2 id="overview" className="sr-only">
              Overview
            </h2>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-pretty">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                No recent transactions. Start by buying or registering a property.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-pretty">Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Discover new investment opportunities tailored to your risk profile.
              </CardContent>
            </Card>
          </section>
        </main>

       {/*  <QuickActions />*/}
      </SidebarInset>
    </SidebarProvider>
  )
}
