"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useIsMobile } from "@/components/ui/use-mobile"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PropertiesTab } from "@/components/properties/properties-tab"
import { BookmarkedTab } from "@/components/properties/bookmarked-tab"
import { Building2, Bookmark } from "lucide-react"

export default function PropertiesPage() {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-1">Properties</h1>
            <p className="text-sm text-muted-foreground">
              Browse and invest in tokenized real estate properties
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all" className="gap-2">
                <Building2 className="h-4 w-4" />
                All Properties
              </TabsTrigger>
              <TabsTrigger value="bookmarked" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarked
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <PropertiesTab />
            </TabsContent>

            <TabsContent value="bookmarked">
              <BookmarkedTab />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
