# ---------- Build Stage ----------
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build   # assumes a "build" script that compiles TypeScript to ./dist

# ---------- Runtime Stage ----------
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy compiled output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --only=production

# Expose service port (adjust if needed)
EXPOSE 3000

# Run the compiled entry point
CMD ["node", "dist/main.js"]
