"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const router = useRouter()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [passwordErrors, setPasswordErrors] = React.useState<string[]>([])

  const validatePassword = (pwd: string) => {
    const errors: string[] = []
    if (pwd.length < 8) errors.push("At least 8 characters")
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter")
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter")
    if (!/[0-9]/.test(pwd)) errors.push("One number")
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("One special character")
    return errors
  }

  React.useEffect(() => {
    if (password) {
      setPasswordErrors(validatePassword(password))
    } else {
      setPasswordErrors([])
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (passwordErrors.length > 0) {
      setError("Please meet all password requirements")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          name: name.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Special handling for email already exists
        if (data.code === 'EMAIL_EXISTS') {
          setError(data.message)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Registration failed')
      }

      // Registration successful - redirect to OTP verification page
      // Don't set loading to false here, let the redirect happen
      router.push('/auth/verify-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
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
              <h3 className="text-sm font-medium text-red-500">Registration failed</h3>
              <p className="mt-1 text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-200">
          Full Name (Optional)
        </Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#0f172a] border-slate-800 text-slate-100 placeholder:text-slate-400"
          disabled={loading}
        />
      </div>

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

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
        {password && (
          <div className="mt-2 space-y-1">
            {passwordErrors.length > 0 ? (
              passwordErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {err}
                </p>
              ))
            ) : (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Password meets all requirements
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-200">
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-[#0f172a] border-slate-800 pr-10 text-slate-100 placeholder:text-slate-400"
            disabled={loading}
            required
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute inset-y-0 right-2 inline-flex items-center rounded-md p-2 text-slate-300 hover:text-white"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Divider */}
      <div className="text-center text-sm text-slate-300">
        {"Already have an account? "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </div>
    </form>
  )
}
