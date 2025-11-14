"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function PrivacyPanel() {
  const [publicProfile, setPublicProfile] = useState(false)
  const [dataSharing, setDataSharing] = useState(false)
  const [marketing, setMarketing] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Profile Visibility</div>
            <div className="text-sm text-muted-foreground">Control whether your profile is visible to others.</div>
          </div>
          <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
        </div>

        <div className="flex items-center gap-3">
          <Checkbox id="ds" checked={dataSharing} onCheckedChange={(v) => setDataSharing(!!v)} />
          <Label htmlFor="ds">Data Sharing Consent</Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="mk" checked={marketing} onCheckedChange={(v) => setMarketing(!!v)} />
          <Label htmlFor="mk">Marketing Emails</Label>
        </div>

        <Button className="w-40">Save</Button>
      </CardContent>
    </Card>
  )
}
