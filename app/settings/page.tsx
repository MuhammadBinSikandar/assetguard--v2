"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProfilePanel } from "@/components/settings/profile-panel"
import { SecurityPanel } from "@/components/settings/security-panel"
import { WalletPanel } from "@/components/settings/wallet-panel"
import { NotificationsPanel } from "@/components/settings/notifications-panel"
import { PrivacyPanel } from "@/components/settings/privacy-panel"
import { ArrowLeft } from "lucide-react"

type TabKey = "Profile" | "Security" | "Wallet" | "Notifications" | "Privacy"

const tabs: TabKey[] = ["Profile", "Security", "Wallet", "Notifications", "Privacy"]

export default function SettingsPage() {
  const [active, setActive] = useState<TabKey>("Profile")
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:py-12">
      <header className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-4 -ml-2 gap-2 transition-all hover:gap-3 hover:cursor-pointer hover:bg-primary hover:border-primary [&:hover]:text-[oklch(0.696_0.17_162.48)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-pretty">User Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, wallet, notifications, and privacy.</p>
      </header>

      <Card className="bg-card">
        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          {/* Left: In-page Sidebar Nav */}
          <nav className="border-border/60 bg-muted/20 p-3 md:border-r md:p-4">
            <ul className="space-y-1">
              {tabs.map((t) => (
                <li key={t}>
                  <Button
                    variant={active === t ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", active === t && "font-medium")}
                    onClick={() => setActive(t)}
                    aria-current={active === t ? "page" : undefined}
                  >
                    {t}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: Dynamic Panel */}
          <section className="p-4 md:p-6">
            {active === "Profile" && <ProfilePanel />}
            {active === "Security" && <SecurityPanel />}
            {active === "Wallet" && <WalletPanel />}
            {active === "Notifications" && <NotificationsPanel />}
            {active === "Privacy" && <PrivacyPanel />}

            <Separator className="mt-6" />
            <div className="mt-4 text-xs text-muted-foreground">
              Tip: Changes in this MVP are simulated locally for demo purposes.
            </div>
          </section>
        </div>
      </Card>
    </div>
  )
}
