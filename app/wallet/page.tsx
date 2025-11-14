"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { WalletHeader } from "@/components/wallet/wallet-header"
import { AddFundsModal } from "@/components/wallet/add-funds-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenHoldings } from "@/components/wallet/token-holdings"
import { TransactionHistory } from "@/components/wallet/transaction-history"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Button } from "@/components/ui/button"

// Page-level state is fine here because we're mocking. Replace with RSC + SWR later if needed.
export default function WalletPage() {
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const isMobile = useIsMobile()

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          {!connected ? (
            <section className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-md text-center">
                <h2 className="text-balance text-2xl font-semibold">Connect your Phantom wallet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect Phantom to view your balances, holdings, and recent activity.
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <Button onClick={() => setConnected(true)}>Connect Wallet</Button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section aria-labelledby="wallet-header" className="mb-6">
                <h1 id="wallet-header" className="sr-only">
                  Wallet Overview
                </h1>
                <WalletHeader onDeposit={() => setAddFundsOpen(true)} onWithdraw={() => setAddFundsOpen(true)} />
              </section>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <TokenHoldings />
                  {/* Add more overview widgets here (e.g., allocation charts) */}
                </TabsContent>

                <TabsContent value="transactions">
                  <TransactionHistory />
                </TabsContent>

                <TabsContent value="activity">
                  <div className="text-sm text-muted-foreground">
                    No recent on-chain activity. Start by depositing funds or purchasing a property fraction.
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>

        <AddFundsModal open={addFundsOpen} onOpenChange={setAddFundsOpen} />
      </SidebarInset>
    </SidebarProvider>
  )
}
