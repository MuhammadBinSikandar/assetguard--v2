"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/useAuth"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login({
        email,
        password,
        rememberMe,
      })

      // Redirect to next page or dashboard
      const next = searchParams.get('next')
      router.push(next || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-start">
            <AlertCircle className="size-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-500">Login failed</h3>
              <p className="mt-1 text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#0f172a] border-slate-800 text-slate-100 placeholder:text-slate-400"
          disabled={loading}
          required
        />
      </div>

      {/* Password with show/hide */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0f172a] border-slate-800 pr-10 text-slate-100 placeholder:text-slate-400"
            disabled={loading}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 inline-flex items-center rounded-md p-2 text-slate-300 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between gap-4">
        <label className="inline-flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={loading}
          />
          <span className="text-sm text-slate-300">Remember me</span>
        </label>
        <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
          Forgot Password?
        </Link>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Log In"
        )}
      </Button>

      {/* Divider */}
      <div className="text-center text-sm text-slate-300">
        {"Don't have an account? "}
        <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}
