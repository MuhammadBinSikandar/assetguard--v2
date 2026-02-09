"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, X } from "lucide-react"

interface KYCPromptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function KYCPromptModal({ open, onOpenChange }: KYCPromptModalProps) {
    const router = useRouter()

    const handleVerifyNow = () => {
        onOpenChange(false)
        router.push('/kyc')
    }

    const handleRemindLater = () => {
        // Set a flag in localStorage to remind later (e.g., show again after 24 hours)
        const remindTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        localStorage.setItem('kyc_remind_later', remindTime.toString())
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">Complete Your KYC Verification</DialogTitle>
                    <DialogDescription className="text-center">
                        To access all features and ensure the security of your account, please complete your KYC verification process.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            1
                        </div>
                        <div>
                            <p className="text-sm font-medium">Identity Verification</p>
                            <p className="text-xs text-muted-foreground">Verify your identity with a government-issued ID</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            2
                        </div>
                        <div>
                            <p className="text-sm font-medium">Address Proof</p>
                            <p className="text-xs text-muted-foreground">Submit proof of address documentation</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            3
                        </div>
                        <div>
                            <p className="text-sm font-medium">Review & Approval</p>
                            <p className="text-xs text-muted-foreground">Our team will review within 24-48 hours</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button onClick={handleVerifyNow} className="w-full">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Verify Now
                    </Button>
                    <Button onClick={handleRemindLater} variant="outline" className="w-full">
                        Remind Me Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
