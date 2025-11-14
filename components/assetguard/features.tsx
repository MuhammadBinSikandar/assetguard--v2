export function Features() {
  const features = [
    {
      title: "Instant Tokenization",
      desc: "Convert properties to blockchain tokens in minutes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
        </svg>
      ),
    },
    {
      title: "Fractional Ownership",
      desc: "Invest starting from $100",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V9Zm9 0h7v7h-7v-7Z" />
        </svg>
      ),
    },
    {
      title: "AI Valuation",
      desc: "Real-time property pricing with ±2% accuracy",
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
    {
      title: "Smart Contracts",
      desc: "Automated, secure transactions on Solana",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 4a2 2 0 0 1 2-2h6l6 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Zm10 0v4h4" />
        </svg>
      ),
    },
    {
      title: "Zero Intermediaries",
      desc: "Peer-to-peer with 70% cost reduction",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 5h10v2H7V5Zm0 6h10v8H7v-8Zm0 6h10v2H7v-2Z" />
        </svg>
      ),
    },
    {
      title: "Investment Insights",
      desc: "ML-powered ROI predictions",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 3h2v18H3V3Zm4 10h2v8H7v-8Zm4-6h2v14h-2V7Zm4 4h2v10h-2V11Zm4-6h2v16h-2V5Z" />
        </svg>
      ),
    },
  ]
  return (
    <section id="features" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-6">
      <div className="max-w-2xl">
        <h2 className="text-4xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {"Powerful features for modern investing"}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {"Everything you need to tokenize, invest, and manage real estate on-chain—securely and transparently."}
        </p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-accent">
            <div className="flex items-center gap-2">
              {f.icon}
              <div className="text-primary text-sm font-medium">{f.title}</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
