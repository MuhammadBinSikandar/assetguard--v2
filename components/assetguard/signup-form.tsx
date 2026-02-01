"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Chrome, Check, X, Wallet, Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function emailIsValid(v: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
}

type Strength = { score: 0 | 1 | 2 | 3; label: "Weak" | "Medium" | "Strong"; color: string }
function getPasswordStrength(pw: string): Strength {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" }
  if (score === 2) return { score: 2, label: "Medium", color: "bg-orange-500" }
  return { score: 3, label: "Strong", color: "bg-green-500" }
}

export function SignupForm() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [name, setName] = useState("")
  const [tos, setTos] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const emailValid = useMemo(() => emailIsValid(email), [email])
  const match = useMemo(() => confirm.length > 0 && confirm === password, [confirm, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          name: name.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed')
      }

      setSuccess(true)

      // Redirect to OTP verification page immediately
      router.push('/auth/verify-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="border border-white/10 bg-[#0b1220]/70 text-white backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/60">
      <CardHeader>
        <CardTitle
          className="text-2xl font-semibold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {"Create Your Account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 text-white">
          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4">
              <div className="flex items-start">
                <Check className="size-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-500">Registration successful!</h3>
                  <p className="mt-1 text-sm text-green-400">
                    Please check your email to verify your account. Redirecting...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-start">
                <AlertCircle className="size-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-500">Registration failed</h3>
                  <p className="mt-1 text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">{"Full Name"}</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/40 border-white/10 placeholder:text-white/50 text-white"
              disabled={loading || success}
            />
            <p className="text-xs text-gray-400">
              {"Optional - helps personalize your experience."}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">{"Email"}</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !emailValid}
                aria-describedby="email-desc"
                className={cn(
                  "pr-10 bg-background/40 border-white/10 placeholder:text-white/50 text-white",
                  email.length > 0 && !emailValid && "aria-[invalid=true]:ring-destructive",
                )}
                disabled={loading || success}
                required
              />
              {email.length > 0 && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {emailValid ? (
                    <Check className="size-4 text-green-500" aria-hidden />
                  ) : (
                    <X className="size-4 text-red-500" aria-hidden />
                  )}
                </span>
              )}
            </div>
            <p id="email-desc" className="text-xs text-gray-400">
              {"Use a valid email address."}
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">{"Password"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="password-strength"
                className="pr-10 bg-background/40 border-white/10 placeholder:text-white/50 text-white"
                disabled={loading || success}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-gray-400 hover:text-white"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Strength bar */}
            <div className="space-y-1.5" id="password-strength">
              <div className="h-2 w-full overflow-hidden rounded bg-gray-700">
                <div
                  className={cn("h-full transition-all", strength.color)}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{strength.label}</p>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-white">{"Confirm Password"}</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirmPw ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={confirm.length > 0 && !match}
                className="pr-10 bg-background/40 border-white/10 placeholder:text-white/50 text-white"
                disabled={loading || success}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-gray-400 hover:text-white"
                aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {!match && confirm.length > 0 && (
              <p className="text-xs text-red-500">{"Passwords do not match."}</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-center gap-2.5">
            <Checkbox id="tos" checked={tos} onCheckedChange={(v) => setTos(Boolean(v))} />
            <label htmlFor="tos" className="cursor-pointer text-[13px] leading-5 text-gray-300">
              {"I agree to the "}
              <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
                {"Terms of Service"}
              </Link>
              {" and "}
              <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
                {"Privacy Policy"}
              </Link>
              {"."}
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={!emailValid || !match || !tos || password.length === 0 || loading || success}
          >
            {loading ? "Creating Account..." : success ? "Account Created!" : "Create Account"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <Separator className="flex-1 bg-gray-700" />
            <span className="text-xs text-gray-400">{"or continue with"}</span>
            <Separator className="flex-1 bg-gray-700" />
          </div>

          {/* Social sign up */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent border-primary/40 text-primary hover:bg-primary/5"
            >
              <Chrome className="mr-2 size-4" />
              {"Sign up with Google"}
            </Button>
          </div>

          {/* Already have account */}
          <p className="text-center text-sm text-gray-400">
            {"Already have an account? "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              {"Log in"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export default SignupForm
