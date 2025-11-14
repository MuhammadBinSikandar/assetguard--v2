"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KycWizard } from "@/components/kyc/kyc-wizard"

export function ProfilePanel() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [kycOpen, setKycOpen] = useState(false)
  const [kycStatus] = useState<"Pending" | "Verified" | "Not Started">("Pending")

  const triggerUpload = () => fileRef.current?.click()
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setPhotoUrl(url)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={photoUrl ?? undefined} alt="Profile photo" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="space-x-2">
              <Button onClick={triggerUpload}>Change Photo</Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <Badge variant={kycStatus === "Verified" ? "default" : kycStatus === "Pending" ? "secondary" : "outline"}>
                KYC: {kycStatus}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Appleseed" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                aria-description="Email is locked after verification"
              />
              <span className="text-xs text-muted-foreground">Non-editable after verification</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" placeholder="United States" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="USA" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="w-40">Save Changes</Button>
            <Button variant="link" onClick={() => setKycOpen(true)}>
              Update KYC Information
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Update KYC</DialogTitle>
          </DialogHeader>
          {/* Reuse existing KYC wizard for the modal */}
          <div className="max-h-[70vh] overflow-auto p-1">
            <KycWizard />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
