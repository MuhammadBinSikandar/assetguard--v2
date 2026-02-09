"use client"

import { RegisterForm } from "@/components/assetguard/register-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <section className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Left: Form on dark surface */}
        <div className="flex items-center justify-center bg-[#0b1220] px-6 py-12 text-white md:px-10">
          <div className="w-full max-w-md">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-balance">Create Account</h1>
            <p className="mb-8 text-sm text-slate-300">Join AssetGuard and start your real estate investment journey.</p>
            <RegisterForm />
          </div>
        </div>

        {/* Right: Branding panel */}
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-500" />
          <div className="absolute inset-0 bg-slate-950/50" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-center p-12 text-white">
            <h2 className="mb-3 text-4xl font-semibold tracking-tight">Get Started Today</h2>
            <p className="max-w-md text-slate-100/90">
              Create your account to access exclusive real estate investment opportunities with AssetGuard's secure platform.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
