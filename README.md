# AssetGuard v2

Enterprise-grade real estate tokenization platform with advanced authentication and security features.

## Features

- 🔐 **Advanced Authentication System**
  - JWT-based access and refresh tokens
  - Secure HTTP-only cookie management
  - OTP email verification
  - Password reset with secure tokens
  - Multi-factor authentication ready

- 🛡️ **Enterprise Security**
  - Redis-backed distributed rate limiting
  - IP spoofing prevention
  - CSRF protection
  - Audit logging
  - Account lockout on suspicious activity

- 🏗️ **Tech Stack**
  - Next.js 15 with App Router
  - TypeScript
  - Prisma ORM
  - PostgreSQL
  - Redis (Upstash)
  - TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (Upstash recommended for production)
- SMTP server or Resend API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/assetguard-v2.git
   cd assetguard-v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration. See [Environment Variables](#environment-variables) section.

4. **Set up the database**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

### Required for Development

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
JWT_ACCESS_PRIVATE_KEY=development-access-secret-change-in-production
JWT_REFRESH_PRIVATE_KEY=development-refresh-secret-change-in-production
```

### Required for Production

```env
# Database
DATABASE_URL="your-production-database-url"

# JWT (use strong secrets!)
JWT_ACCESS_PRIVATE_KEY=your-strong-secret-key
JWT_REFRESH_PRIVATE_KEY=your-strong-secret-key

# Rate Limiting - CRITICAL
RATE_LIMIT_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Trusted Proxies - CRITICAL FOR SECURITY
TRUSTED_PROXY_IPS=10.0.0.1,172.16.0.0/12

# Email
RESEND_API_KEY=your-resend-key
# OR SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

See `.env.example` for complete list.

## Security Features

### Rate Limiting

The application uses Redis-backed distributed rate limiting to prevent abuse:

- **Login attempts**: 5 per 15 minutes, 1-hour lockout after exceeding
- **Registration**: 3 per hour
- **OTP verification**: 10 per 15 minutes, 30-minute lockout
- **Password reset**: 3 per hour

**Production Setup Required:**

1. Configure Redis (Upstash recommended)
2. Set up reverse proxy to strip client headers
3. Configure trusted proxy IPs

See [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) for detailed setup instructions.

### IP Spoofing Prevention

The application validates proxy configurations to prevent IP spoofing:

- Only trusts `x-forwarded-for` from configured trusted proxies
- Automatically handles Cloudflare's `cf-connecting-ip`
- Falls back to direct connection IP when no trusted proxies configured

**Critical:** Your reverse proxy MUST strip client-supplied forwarding headers. See [deployment guide](./DEPLOYMENT_SECURITY.md#reverse-proxy-configuration).

### Authentication Security

- ✅ Cryptographically secure token generation
- ✅ HTTP-only, secure cookies
- ✅ JWT with algorithm restriction (prevents confusion attacks)
- ✅ Automatic token refresh
- ✅ Secure password hashing (bcrypt)
- ✅ Email verification with OTP
- ✅ Password strength validation

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   └── auth/         # Authentication endpoints
│   ├── auth/             # Auth pages (login, register, verify)
│   └── (protected)/      # Protected application routes
├── components/
│   ├── assetguard/       # Core components
│   └── ui/               # UI components
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── auth-edge.ts      # Edge-compatible auth
│   ├── rateLimit.ts      # Rate limiting (Redis-backed)
│   ├── bcrypt.ts         # Password hashing
│   ├── email.ts          # Email sending
│   └── logger.ts         # Audit logging
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Request middleware
```

## Database Schema

Key models:

- **User**: User accounts with roles and verification status
- **Session**: Active user sessions with refresh tokens
- **EmailVerificationToken**: OTP tokens for email verification
- **PasswordResetToken**: Secure tokens for password reset
- **AuditLog**: Security audit trail

Run migrations:

```bash
npm run prisma:migrate
```

View database in Prisma Studio:

```bash
npm run prisma:studio
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - User login with rate limiting
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend verification OTP
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Protected Routes

All routes under `/dashboard`, `/portfolio`, `/properties`, etc. require authentication.

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**

2. **Configure environment variables** in Vercel dashboard

3. **Set up Upstash Redis**

   ```bash
   # In Vercel, add these environment variables:
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

4. **Deploy**
   ```bash
   vercel deploy --prod
   ```

### Other Platforms

See [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) for:

- Nginx configuration
- AWS ALB setup
- Docker deployment
- Cloudflare configuration

## Development

### Running Tests

```bash
npm run test
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Database Operations

```bash
# Create migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Security Checklist

Before deploying to production:

- [ ] Changed all default secrets (JWT keys, etc.)
- [ ] Configured Redis for rate limiting
- [ ] Set up reverse proxy with header stripping
- [ ] Configured `TRUSTED_PROXY_IPS`
- [ ] Enabled rate limiting (`RATE_LIMIT_ENABLED=true`)
- [ ] Set up email sending (Resend or SMTP)
- [ ] Configured database with SSL
- [ ] Set `NODE_ENV=production`
- [ ] Enabled HTTPS/SSL
- [ ] Reviewed audit logs configuration
- [ ] Set up monitoring and alerts

## Troubleshooting

### Rate Limiting Not Working

**Problem**: Users on different servers can bypass rate limits

**Solution**: Verify Redis is configured and connected. Check logs for "Redis not available" warnings.

### IP Spoofing Concerns

**Problem**: Rate limits being bypassed via header manipulation

**Solution**:

1. Ensure reverse proxy strips client headers
2. Configure `TRUSTED_PROXY_IPS`
3. Review [deployment guide](./DEPLOYMENT_SECURITY.md)

### Email Not Sending

**Problem**: Users not receiving verification emails

**Solution**:

- Check email configuration in `.env`
- Verify SMTP credentials or Resend API key
- Check spam folder
- Review application logs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- Open an issue on GitHub
- Check [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) for security setup
- Review environment variables in `.env.example`
