export function Process() {
  const steps = [
    {
      title: "Sign Up & Complete KYC",
      desc: "Create an account and verify your identity",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-8 9a8 8 0 0 1 16 0H4Z" />
        </svg>
      ),
    },
    {
      title: "Register Property",
      desc: "Submit property details and documents",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 3h10l6 6v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm10 0v6h6" />
        </svg>
      ),
    },
    {
      title: "Buy/Sell Property fractions",
      desc: "Trade fractional tokens on-chain",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 11h6v6H4v-6Zm7-4h4v12h-4V9Zm7-6h4v18h-4V3Z" />
        </svg>
      ),
    },
    {
      title: "Track & Manage Portfolio",
      desc: "Monitor returns and payouts in real time",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 13h4v8H3v-8Zm7-4h4v12h-4V9Zm7-6h4v18h-4V3Z" />
        </svg>
      ),
    },
  ]
  return (
    <section id="how-it-works" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-6">
      <div className="max-w-2xl">
        <h2 className="text-4xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {"How it works"}
        </h2>
        <p className="mt-3 text-muted-foreground">{"4 simple steps from onboarding to investing."}</p>
      </div>
      <ol className="relative mt-8 grid gap-6 md:grid-cols-2">
        {/* connector line */}
        <div
          className="pointer-events-none absolute left-1 top-0 hidden h-full w-px bg-border md:block"
          aria-hidden="true"
        />
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {s.icon}
              <div className="text-primary font-semibold">{`${i + 1}. ${s.title}`}</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
