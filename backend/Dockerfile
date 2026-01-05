FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.5.0 --activate
WORKDIR /app

# 1. Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2. Build
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

# 3. Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
COPY --from=builder /app/dist ./dist
# Install only prod deps
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["node", "dist/server.js"]
# Note: Checking if entry point is server.js or main.js. Usually NestJS is main.js, Express might be different.
# Original Dockerfile said: CMD ["node", "dist/server.js"]
# I should verify the build output or package.json start script.
