"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Kbd } from "@/components/ui/kbd"

export function SecurityPanel() {
  const [twoFA, setTwoFA] = useState(false)
  const backupCode = useMemo(() => "A7F2-9QX4-PL8C", [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="current">Current Password</Label>
            <Input id="current" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new">New Password</Label>
            <Input id="new" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <Input id="confirm" type="password" />
          </div>
        </div>
        <div>
          <Button className="w-44">Update Password</Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Two-Factor Authentication</div>
            <div className="text-sm text-muted-foreground">Add an extra layer of security to your account.</div>
          </div>
          <Switch checked={twoFA} onCheckedChange={setTwoFA} aria-label="Enable or disable 2FA" />
        </div>

        {twoFA && (
          <div className="grid gap-3 rounded-md border p-4">
            <div className="text-sm text-muted-foreground">Scan this QR code with your authenticator app.</div>
            <img
              src={"/placeholder.svg?height=160&width=160&query=Authenticator QR"}
              alt="Authenticator setup QR code"
              className="size-40 rounded bg-muted"
            />
            <div className="text-sm">
              Backup code: <Kbd className="ml-1">{backupCode}</Kbd>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
