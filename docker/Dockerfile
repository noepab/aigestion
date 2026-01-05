# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm and turbo
RUN npm i -g pnpm@8.15.4 turbo

# Copy the entire project (respecting .gcloudignore)
COPY . .

# Install dependencies
RUN pnpm install

# Build ONLY the backend and the landing page app
RUN turbo run build --filter=nexus-v1-dashboard-backend --filter=landingpage

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app

# Copy built artifacts and node_modules
# We need node_modules for some production dependencies in the backend
COPY --from=builder /app ./

EXPOSE 8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/dist/server.js"]
