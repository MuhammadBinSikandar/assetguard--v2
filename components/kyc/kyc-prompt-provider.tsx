"use client"

import * as React from "react"
import { useAuth } from "@/hooks/useAuth"
import { KYCPromptModal } from "@/components/kyc/kyc-prompt-modal"
import { usePathname } from "next/navigation"

export function KYCPromptProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth()
    const pathname = usePathname()
    const [showKYCPrompt, setShowKYCPrompt] = React.useState(false)
    const [hasChecked, setHasChecked] = React.useState(false)

    React.useEffect(() => {
        // Don't show on auth pages or if already checked
        const isAuthPage = pathname?.startsWith('/login') ||
            pathname?.startsWith('/register') ||
            pathname?.startsWith('/signup') ||
            pathname?.startsWith('/auth') ||
            pathname?.startsWith('/verify') ||
            pathname?.startsWith('/forgot-password') ||
            pathname?.startsWith('/reset-password')

        const isKYCPage = pathname?.startsWith('/kyc')

        if (hasChecked || isAuthPage || isKYCPage || !isAuthenticated || !user) {
            return
        }

        // Check if user is KYC verified
        const isKYCVerified = user?.roles?.includes('kyc_verified') || false

        if (!isKYCVerified) {
            // Check if user chose "Remind Me Later" and it hasn't expired
            const remindLaterTime = localStorage.getItem('kyc_remind_later')

            if (remindLaterTime) {
                const remindTime = parseInt(remindLaterTime, 10)
                if (Date.now() < remindTime) {
                    setHasChecked(true)
                    return
                } else {
                    // Remind time has passed, clear it
                    localStorage.removeItem('kyc_remind_later')
                }
            }

            // Check if user has permanently dismissed (optional feature)
            const permanentlyDismissed = localStorage.getItem('kyc_permanently_dismissed')
            if (permanentlyDismissed === 'true') {
                setHasChecked(true)
                return
            }

            // Show the KYC prompt
            setShowKYCPrompt(true)
        }

        setHasChecked(true)
    }, [user, isAuthenticated, pathname, hasChecked])

    return (
        <>
            {children}
            <KYCPromptModal
                open={showKYCPrompt}
                onOpenChange={setShowKYCPrompt}
            />
        </>
    )
}
