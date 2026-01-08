FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build

FROM nginx:stable-alpine
COPY --from=builder /app/frontend/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
