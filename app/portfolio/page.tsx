"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TotalPropertiesTab } from "@/components/portfolio/total-properties-tab"
import { RegisteredPropertiesTab } from "@/components/portfolio/registered-properties-tab"

export default function PortfolioPage() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="min-h-svh">
        <TopBar />
        <main className="px-4 pb-10 pt-4 md:px-6">
          <Tabs defaultValue="total" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="total">Total Properties</TabsTrigger>
              <TabsTrigger value="registered">Registered Properties</TabsTrigger>
            </TabsList>

            <TabsContent value="total">
              <TotalPropertiesTab />
            </TabsContent>

            <TabsContent value="registered">
              <RegisteredPropertiesTab />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}