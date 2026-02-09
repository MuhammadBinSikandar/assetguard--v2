"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VerifyOTPForm() {
  const router = useRouter()

  const [email, setEmail] = React.useState('')
  const [otpCode, setOTPCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  // Fetch email from server-side cookie or query param (fallback)
  React.useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch('/api/auth/get-pending-email')
        const data = await response.json()
        if (data.success && data.email) {
          setEmail(data.email)
        }
      } catch (err) {
        console.error('Failed to fetch email:', err)
      }
    }
    fetchEmail()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otpCode: otpCode.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Verification failed')
      }

      setSuccess(data.message)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setSuccess("")
    setResending(true)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend code')
      }

      setSuccess('A new verification code has been sent to your email.')
      setOTPCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOTPCode(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-start">
            <AlertCircle className="size-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-500">Verification failed</h3>
              <p className="mt-1 text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex items-start">
            <CheckCircle2 className="size-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-500">Success</h3>
              <p className="mt-1 text-sm text-green-400">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Display or Input */}
      {email ? (
        <div className="rounded-md bg-slate-800/50 border border-slate-700 p-4">
          <p className="text-sm text-slate-400">Verification code sent to:</p>
          <p className="text-base text-slate-200 font-medium mt-1">{email}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0f172a] border-slate-800 text-slate-100 placeholder:text-slate-400"
            disabled={loading || resending}
            required
          />
          <p className="text-xs text-slate-400">
            Enter the email address you registered with
          </p>
        </div>
      )}

      {/* OTP Code */}
      <div className="space-y-2">
        <Label htmlFor="otpCode" className="text-slate-200">
          Verification Code
        </Label>
        <Input
          id="otpCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={otpCode}
          onChange={handleOTPChange}
          className="bg-[#0f172a] border-slate-800 text-slate-100 placeholder:text-slate-400 text-center text-2xl tracking-[0.5em] font-mono"
          disabled={loading || resending}
          required
          autoFocus
        />
        <p className="text-xs text-slate-400">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading || resending || otpCode.length !== 6 || !email}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Email"
        )}
      </Button>

      {/* Resend OTP */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={loading || resending || !email}
          className="text-sm text-primary underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {resending && <Loader2 className="h-3 w-3 animate-spin" />}
          {resending ? "Sending..." : "Didn't receive the code? Resend"}
        </button>
      </div>

      {/* Back to login */}
      <div className="text-center text-sm text-slate-300">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-slate-400 underline-offset-4 hover:underline"
        >
          Back to Login
        </button>
      </div>
    </form>
  )
}