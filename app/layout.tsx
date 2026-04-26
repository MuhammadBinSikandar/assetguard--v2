import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatWidget } from "@/components/ai/chat-widget"
import { ReduxProvider } from "@/store/redux/Provider"
import { KYCPromptProvider } from "@/components/kyc/kyc-prompt-provider"
import { WalletContextProvider } from "@/wallet/WalletContextProvider"

export const metadata: Metadata = {
  title: "AssetGuard",
  description: "Blockchain Real Estate Platform",
  generator: "v0.app",
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <body className="font-sans bg-background text-foreground">
        <WalletContextProvider>
          <ReduxProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <KYCPromptProvider>
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
                <ChatWidget />
                <Analytics />
              </KYCPromptProvider>
            </ThemeProvider>
          </ReduxProvider>
        </WalletContextProvider>
      </body>
    </html>
  )
}
