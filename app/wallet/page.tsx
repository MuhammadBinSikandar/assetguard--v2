"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { WalletHeader } from "@/components/wallet/wallet-header"
import { AddFundsModal } from "@/components/wallet/add-funds-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenHoldings } from "@/components/wallet/token-holdings"
import { TransactionHistory } from "@/components/wallet/transaction-history"
import { WalletLinker } from "@/components/wallet/wallet-linker"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useAppSelector } from "@/store/redux/store"
import { selectIsHydrated } from "@/store/redux/userSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function WalletPageContent() {
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const isMobile = useIsMobile()

  // Auth state from Redux
  const user = useAppSelector((state) => state.user.user)
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)
  const isHydrated = useAppSelector(selectIsHydrated)

  // Linked wallet state from backend
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)

  const fetchLinkedWallet = useCallback(async () => {
    try {
      setWalletLoading(true)
      const res = await fetch("/api/wallet/link", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setLinkedWallet(data.walletAddress)
      }
    } catch (err) {
      console.error("Failed to fetch linked wallet:", err)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchLinkedWallet()
    } else {
      setWalletLoading(false)
    }
  }, [isAuthenticated, fetchLinkedWallet])

  const handleWalletLinked = (address: string) => {
    setLinkedWallet(address)
  }

  // Determine effective "connected" state: wallet is linked (ownership proven)
  const isWalletLinked = !!linkedWallet

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          {/* Still checking auth — show skeleton, not "Sign in Required" */}
          {!isHydrated ? (
            <section className="flex min-h-[60vh] items-center justify-center">
              <div className="space-y-4 w-full max-w-md">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </section>
          ) : !isAuthenticated ? (
            <section className="flex min-h-[60vh] items-center justify-center">
              <Card>
                <CardContent className="py-12 text-center space-y-2">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Sign in Required</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Please sign in to connect and verify your Solana wallet.
                  </p>
                </CardContent>
              </Card>
            </section>
          ) : walletLoading ? (
            /* Loading wallet state */
            <section className="flex min-h-[60vh] items-center justify-center">
              <div className="space-y-4 w-full max-w-md">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </section>
          ) : !isWalletLinked ? (
            /* Wallet not linked — show linker */
            <section className="flex min-h-[60vh] items-center justify-center">
              <div className="w-full max-w-md">
                <WalletLinker
                  userId={user?.id ?? ""}
                  onLinked={handleWalletLinked}
                  linkedWallet={linkedWallet}
                />
              </div>
            </section>
          ) : (
            /* Wallet linked — show full dashboard */
            <>
              <section aria-labelledby="wallet-header" className="mb-6">
                <h1 id="wallet-header" className="sr-only">
                  Wallet Overview
                </h1>
                <WalletHeader walletAddress={linkedWallet} onDeposit={() => setAddFundsOpen(true)} onWithdraw={() => setAddFundsOpen(true)} />
              </section>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Linked wallet badge */}
                  <WalletLinker
                    userId={user?.id ?? ""}
                    linkedWallet={linkedWallet}
                  />
                  <TokenHoldings walletAddress={linkedWallet} />
                </TabsContent>

                <TabsContent value="transactions">
                  <TransactionHistory walletAddress={linkedWallet} />
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

export default function WalletPage() {
  return <WalletPageContent />
}
