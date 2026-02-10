FROM node:20-alpine

# System deps (needed for Prisma, native modules)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install deps first (cache-friendly)
COPY package.json package-lock.json* ./
# Prisma schema is needed for postinstall (prisma generate)
COPY prisma ./prisma
RUN npm install

# Copy source
COPY . .

# Prisma client (safe in dev)
RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]