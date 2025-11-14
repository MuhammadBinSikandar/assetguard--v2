export function Footer() {
  return (
    <footer id="contact" className="mt-16 border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                {/* blockchain icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
                </svg>
              </span>
              <span className="font-semibold">AssetGuard</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {"Tokenize, invest, and manage real estate on-chain with transparent ownership and instant settlement."}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {/* social icons */}
              <a aria-label="Twitter" href="#" className="rounded-md border p-2 hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.2 1.7-2.1-.7.4-1.6.8-2.4.9C18.3 4.5 17.3 4 16.2 4c-2.1 0-3.8 1.9-3.4 4-3-.1-5.7-1.7-7.5-4-.9 1.5-.5 3.5 1 4.5-.6 0-1.2-.2-1.7-.5 0 1.8 1.2 3.3 2.9 3.6-.5.1-1 .2-1.5.1.4 1.4 1.8 2.5 3.3 2.5-1.3 1-3 1.6-4.7 1.6H3c1.7 1.1 3.8 1.7 6 1.7 7.2 0 11.3-6 11-11.3.8-.6 1.5-1.3 2-2.2Z" />
                </svg>
              </a>
              <a aria-label="LinkedIn" href="#" className="rounded-md border p-2 hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5C4.98 4.9 3.9 6 2.5 6S0 4.9 0 3.5 1.1 1 2.5 1s2.48 1.1 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.5-2.7 5.2-2.7 5.6 0 6.6 3.7 6.6 8.5V24H19V17c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8V24H7.5V8z" />
                </svg>
              </a>
              <a aria-label="GitHub" href="#" className="rounded-md border p-2 hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.6-4-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.3 2 1.3 1.2 2 3.1 1.4 3.8 1.1.1-.9.5-1.4.9-1.7-2.7-.3-5.6-1.4-5.6-6.1 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.7 7.7 18.7 8 18.7 8c.6 1.7.2 3 .1 3.3.8.8 1.2 1.9 1.2 3.2 0 4.7-2.9 5.8-5.6 6.1.5.4 1 1.2 1 2.5v3.7c0 .3.2.6.8.5A12 12 0 0 0 12 .5Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#properties" className="hover:text-foreground">
                  Properties
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Resources</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* newsletter */}
        <div className="mt-10 rounded-lg border bg-background p-4 md:p-5">
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Subscribe to our newsletter</div>
              <p className="text-sm text-muted-foreground">
                {"The latest listings and insights, straight to your inbox."}
              </p>
            </div>
            <form className="flex w-full max-w-md items-center gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none ring-0"
              />
              <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AssetGuard. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
