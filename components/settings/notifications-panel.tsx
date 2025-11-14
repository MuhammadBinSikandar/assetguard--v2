"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NotificationsPanel() {
  const [property, setProperty] = useState(true)
  const [investment, setInvestment] = useState(true)
  const [newsletter, setNewsletter] = useState(false)
  const [freq, setFreq] = useState("realtime")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <Checkbox id="n1" checked={property} onCheckedChange={(v) => setProperty(!!v)} />
            <Label htmlFor="n1">Property Updates</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="n2" checked={investment} onCheckedChange={(v) => setInvestment(!!v)} />
            <Label htmlFor="n2">Investment Approvals</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="n3" checked={newsletter} onCheckedChange={(v) => setNewsletter(!!v)} />
            <Label htmlFor="n3">Weekly Newsletter</Label>
          </div>
        </div>

        <div className="grid gap-2 md:max-w-xs">
          <Label>Notification Frequency</Label>
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-48">Save Preferences</Button>
      </CardContent>
    </Card>
  )
}
