"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

const MASKED = "8Df4z...R2qH"

export function WalletPanel() {
  const [connected, setConnected] = useState(true)
  const [isDefault, setIsDefault] = useState(true)
  const [name] = useState("Solana Wallet")
  const [addr] = useState(MASKED)

  const copy = async () => {
    await navigator.clipboard.writeText("8Df4zF6K3hYfGks2981R2qH")
    toast({ title: "Address copied" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Management</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Wallet Name</Label>
            <Input value={name} readOnly />
          </div>
          <div className="grid gap-2">
            <Label>Wallet Address</Label>
            <div className="flex items-center gap-2">
              <Input value={addr} readOnly />
              <Button variant="outline" onClick={copy}>
                Copy
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Connection Status:</span>
            <Badge variant={connected ? "default" : "outline"}>{connected ? "Connected" : "Disconnected"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Default Wallet</span>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={() => setConnected(false)}>
            Disconnect Wallet
          </Button>
          <Button onClick={() => setConnected(true)}>Connect New Wallet</Button>
        </div>

        <div className="text-xs text-muted-foreground">Note: This MVP simulates wallet connection status locally.</div>
      </CardContent>
    </Card>
  )
}
