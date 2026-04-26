# Environment variables (template)

Copy blocks into your `.env` and replace placeholder values. **Do not commit** a real `.env` with secrets.

---

## Database (PostgreSQL / Neon)

```env
# Pooled URL (e.g. Neon + pgbouncer)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"

# Direct URL for Prisma migrations (non-pooler host if required)
DIRECT_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"

# Optional: Prisma shadow DB (local or dedicated DB) — only if your setup needs it
# SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@localhost/shadow"
```

---

## JWT and auth

Access and refresh tokens use **HS256** in code (`lib/auth.ts`); there is no `JWT_ALG` env.

```env
JWT_ACCESS_PRIVATE_KEY="replace-with-long-random-string-or-rsa-pem"
JWT_REFRESH_PRIVATE_KEY="replace-with-long-random-string-or-rsa-pem"

ACCESS_TOKEN_EXP="1h"
REFRESH_TOKEN_EXP="30d"
REFRESH_TOKEN_EXP_REMEMBER="30d"

BCRYPT_SALT_ROUNDS="12"
```

---

## Email

```env
# mock | resend | sendgrid | nodemailer
EMAIL_PROVIDER="mock"

EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="AssetGuard"

# Resend (if EMAIL_PROVIDER=resend)
RESEND_API_KEY=""
# Or generic
EMAIL_API_KEY=""

# SendGrid (if EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=""

# Nodemailer / SMTP (if EMAIL_PROVIDER=nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER=""
EMAIL_PASSWORD=""

# Aliases also read by code
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
```

---

## App URLs (browser + server)

`NEXT_PUBLIC_APP_URL` is used for links in emails (`lib/email.ts`).

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Cookies

```env
COOKIE_DOMAIN="localhost"
COOKIE_SECURE="false"
COOKIE_SAME_SITE="strict"
```

---

## Rate limiting and sessions

```env
RATE_LIMIT_ENABLED="true"

MAX_SESSIONS_PER_USER="5"
```

---

## Security

```env
CSRF_SECRET="replace-with-random-string"
```

---

## Audit and debug

```env
NODE_ENV="development"

AUDIT_LOG_ENABLED="true"
AUDIT_LOG_RETENTION_DAYS="90"

DEBUG_MODE="false"
DEBUG_AUTH="false"
DEBUG_CONSOLE="false"

NEXT_PUBLIC_DEBUG_AUTH="false"
NEXT_PUBLIC_DEBUG_CONSOLE="false"
```

---

## Solana (minting, escrow, token purchases)

```env
# Required: Base58-encoded 64-byte secret key (or JSON array of 64 bytes) for the admin wallet
# This key signs mints, token transfers, and SOL payouts. Keep it secret.
ADMIN_SECRET_KEY="your_base58_secret_key_here"

# Optional: public address of the same wallet (validates that ADMIN_SECRET_KEY matches)
# Use one of these; both are supported in code
ESCROW_WALLET="DftvoWmHh2v1kyFiwec4bGevSLB13ksXFutmnkJWnU5o"
# ADMIN_WALLET="DftvoWmHh2v1kyFiwec4bGevSLB13ksXFutmnkJWnU5o"

# RPC (defaults to public devnet if unset)
SOLANA_RPC_URL="https://api.devnet.solana.com"

# Client UI (wallet components): devnet | mainnet-beta
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
```

---

## Pinata (KYC / property uploads)

```env
PINATA_JWT=""
PINATA_GATEWAY=""
```

---

## Chat (`app/api/chat`)

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_CHAT_MODEL="tinyllama"
```

---

## Quick checklist

- [ ] `DATABASE_URL` and (if Prisma / Docker use it) `DIRECT_URL` / `SHADOW_DATABASE_URL` match your setup.
- [ ] `JWT_ACCESS_PRIVATE_KEY`, `JWT_REFRESH_PRIVATE_KEY`, and `CSRF_SECRET` are strong in production.
- [ ] `ADMIN_SECRET_KEY` is the private key for your escrow admin wallet; if you set `ESCROW_WALLET` (or `ADMIN_WALLET`), it must be that wallet’s public address.
- [ ] `EMAIL_*` or `RESEND_API_KEY` / `SENDGRID_API_KEY` if you do not use `EMAIL_PROVIDER=mock`.
- [ ] `NEXT_PUBLIC_APP_URL` matches your deployed site URL in production.
