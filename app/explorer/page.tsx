"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/explorer/stats-cards"
import { SearchBar } from "@/components/explorer/search-bar"
import { ExplorerFilters } from "@/components/explorer/filters"
import { TransactionFeed } from "@/components/explorer/transaction-feed"
import { WalletDetails } from "@/components/wallet/wallet-details"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { useIsMobile } from "@/components/ui/use-mobile"

export default function ExplorerPage() {
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"wallet" | "transaction" | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Simple heuristic: if query looks like a wallet address (alphanumeric, ~40+ chars), show wallet details
    if (query.length >= 32) {
      setSearchType("wallet")
    } else if (query.length > 0) {
      setSearchType("transaction")
    } else {
      setSearchType(null)
    }
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-balance">Blockchain Explorer</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Search by transaction hash, wallet address, or property token. Monitor network activity and inspect
                transactions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="https://solscan.io/?cluster=devnet" target="_blank" rel="noopener noreferrer">
                  View on Solscan (Devnet)
                </Link>
              </Button>
            </div>
          </header>

          <SearchBar onSearch={handleSearch} />

          {searchType === "wallet" ? (
            <WalletDetails
              initialAddress={searchQuery}
              onBack={() => {
                setSearchType(null)
                setSearchQuery("")
              }}
            />
          ) : (
            <>
              <StatsCards />

              <ExplorerFilters />

              <section aria-label="Recent transactions" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Recent Transactions</h2>
                </div>
                <Suspense fallback={<div className="text-sm text-muted-foreground">Loading transactions…</div>}>
                  <TransactionFeed />
                </Suspense>
              </section>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
