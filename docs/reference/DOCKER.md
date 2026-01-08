# 🐳 Docker Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Services](#services)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## Overview

NEXUS V1 uses Docker for containerized deployment across all environments. This guide covers everything from local development to production deployment.

**Key Features:**

- 🚀 Multi-stage builds for optimized images
- 🔒 Security-first with non-root users
- 📊 Health checks for all services
- 🔄 Hot reload in development
- 📦 Complete service stack (MongoDB, RabbitMQ, Redis)
- 🌐 Nginx reverse proxy with SSL support
- 📈 Resource limits and auto-scaling

---

## Prerequisites

### Required Software

```bash
# Docker Desktop (includes Docker Compose)
# Windows/Mac: https://www.docker.com/products/docker-desktop
# Linux: https://docs.docker.com/engine/install/

# Verify installation
docker --version          # Should be 20.10+
docker-compose --version  # Should be 2.0+
```

### System Requirements

- **Development:**

  - 8GB RAM minimum (16GB recommended)
  - 20GB free disk space
  - CPU: 4 cores (8 cores recommended)

- **Production:**
  - 16GB RAM minimum (32GB recommended)
  - 100GB free disk space
  - CPU: 8 cores minimum
  - Network: Static IP with open ports

---

## Quick Start

### 1. Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/noepab/Alejandro.git
cd Alejandro

# Run setup script
chmod +x scripts/*.sh
./scripts/docker-setup.sh
```

The setup script will:

- ✅ Validate prerequisites
- ✅ Create .env from template
- ✅ Pull base images
- ✅ Build custom images
- ✅ Start all services
- ✅ Verify health

### 2. Manual Setup

```bash
# 1. Configure environment
cp .env.docker.example .env
# Edit .env with your API keys and secrets

# 2. Build images
docker-compose build

# 3. Start services
docker-compose up -d

# 4. Check health
./scripts/docker-health-check.sh
```

### 3. Verify Installation

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f app

# Test endpoints
curl http://localhost:3000/health  # Backend
curl http://localhost:5173         # Frontend
```

---

## Architecture

### Service Stack

```
┌─────────────────────────────────────────────────┐
│                   Nginx (80/443)                │
│              Reverse Proxy + SSL                │
└────────────┬────────────────────────┬───────────┘
             │                        │
    ┌────────▼────────┐      ┌───────▼───────┐
    │  Frontend :5173 │      │ Backend :3000  │
    │   React + Vite  │      │ Node.js + TS   │
    └─────────────────┘      └───┬────────────┘
                                 │
         ┌───────────────────────┼────────────────┐
         │                       │                │
    ┌────▼─────┐         ┌──────▼──────┐   ┌────▼─────┐
    │ MongoDB  │         │  RabbitMQ   │   │  Redis   │
    │  :27017  │         │ :5672/15672 │   │  :6379   │
    └──────────┘         └─────────────┘   └──────────┘
         │                       │                │
    ┌────▼─────────────────┬────▼────────────────▼─────┐
    │              Docker Network                       │
    │           alejandro-network (bridge)              │
    └───────────────────────────────────────────────────┘
```

### Container Images

| Service    | Base Image                   | Size   | Purpose            |
| ---------- | ---------------------------- | ------ | ------------------ |
| App        | node:20-alpine               | ~200MB | Frontend + Backend |
| MongoDB    | mongo:7-jammy                | ~700MB | Document database  |
| RabbitMQ   | rabbitmq:3-management-alpine | ~200MB | Message broker     |
| Redis      | redis:7-alpine               | ~50MB  | Cache + pub/sub    |
| Nginx      | nginx:alpine                 | ~40MB  | Reverse proxy      |
| Evaluation | python:3.11-slim             | ~300MB | Python service     |

### Multi-Stage Build

```dockerfile
# Dockerfile structure
FROM node:20-alpine AS base       # Base layer
FROM base AS deps                 # Install dependencies
FROM base AS builder              # Build applications
FROM base AS runner               # Minimal runtime
```

**Benefits:**

- ⚡ Faster builds (layer caching)
- 📦 Smaller images (only runtime deps)
- 🔒 More secure (fewer packages)

---

## Configuration

### Environment Variables

Create `.env` from template:

```bash
cp .env.docker.example .env
```

**Critical Variables:**

```env
# Application
NODE_ENV=development|production
JWT_SECRET=<strong-random-secret>

# MongoDB
MONGO_ROOT_PASSWORD=<strong-password>
MONGODB_URI=mongodb://admin:<password>@mongodb:27017/alejandro_db

# RabbitMQ
RABBITMQ_DEFAULT_PASS=<strong-password>
RABBITMQ_URI=amqp://admin:<password>@rabbitmq:5672

# Redis
REDIS_PASSWORD=<strong-password>

# AI APIs
GEMINI_API_KEY=<your-api-key>
WINDSURF_API_TOKEN=<your-token>
```

### Docker Compose Profiles

```bash
# Start with specific profile
docker-compose --profile evaluation up -d

# Available profiles:
# - production (nginx with SSL)
# - evaluation (Python evaluation service)
```

### Port Mappings

| Service       | Internal | External | Description     |
| ------------- | -------- | -------- | --------------- |
| Frontend      | 5173     | 5173     | Vite dev server |
| Backend       | 3000     | 3000     | API server      |
| MongoDB       | 27017    | 27017    | Database        |
| RabbitMQ      | 5672     | 5672     | AMQP            |
| RabbitMQ Mgmt | 15672    | 15672    | Web UI          |
| Redis         | 6379     | 6379     | Cache           |
| Nginx         | 80/443   | 80/443   | Web server      |

---

## Development

### Starting Development Environment

```bash
# Start all services
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d mongodb redis

# Scale app instances
docker-compose up -d --scale app=2
```

### Hot Reload

Development uses volume mounts for hot reload:

```yaml
volumes:
  - ./src:/app/src # Frontend code
  - ./server:/app/server # Backend code
  - /app/node_modules # Isolated node_modules
```

**Changes are reflected immediately** without rebuilding.

### Development Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. View logs
docker-compose logs -f app

# 3. Execute commands in container
docker-compose exec app npm run lint
docker-compose exec app npm test

# 4. Access shell
docker-compose exec app sh

# 5. Restart after config changes
docker-compose restart app

# 6. Rebuild after dependency changes
docker-compose up -d --build app
```

### Database Access

```bash
# MongoDB
docker-compose exec mongodb mongosh -u admin -p <password>

# Redis
docker-compose exec redis redis-cli -a <password>

# RabbitMQ (via web UI)
# Open http://localhost:15672
# Login: admin / <password>
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured with strong secrets
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Load balancer configured (if using multiple hosts)

### Production Setup

```bash
# 1. Use production compose file
export COMPOSE_FILE=docker-compose.prod.yml

# 2. Build production images
docker-compose build --no-cache

# 3. Start services
docker-compose up -d

# 4. Verify health
./scripts/docker-health-check.sh prod

# 5. Check logs
docker-compose logs -f
```

### SSL Configuration

```bash
# Using Let's Encrypt with Certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com

# Update nginx config to use certificates
# Certificates will be at:
# - /etc/letsencrypt/live/your-domain.com/fullchain.pem
# - /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Zero-Downtime Deployment

```bash
# Build new images
docker-compose build

# Scale up new instances
docker-compose up -d --scale app=4 --no-recreate

# Wait for health checks
sleep 30

# Remove old instances
docker-compose up -d --scale app=2

# Verify
./scripts/docker-health-check.sh prod
```

---

## Services

### MongoDB

**Configuration:** `.docker/mongo-init/init.sh`

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <password>

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup

# View logs
docker-compose logs -f mongodb
```

**Collections:**

- `users` - User accounts with authentication
- `containers` - Container management data
- `evaluations` - Evaluation results and metrics

### RabbitMQ

**Configuration:** `.docker/rabbitmq/`

```bash
# Management UI
open http://localhost:15672

# Check queues
docker-compose exec rabbitmq rabbitmqctl list_queues

# Check connections
docker-compose exec rabbitmq rabbitmqctl list_connections

# Purge queue
docker-compose exec rabbitmq rabbitmqctl purge_queue evaluation.tasks
```

**Queues:**

- `evaluation.tasks` - Evaluation job queue
- `container.events` - Container lifecycle events
- `notifications` - System notifications

### Redis

**Configuration:** `.docker/redis/redis.conf`

```bash
# Access Redis CLI
docker-compose exec redis redis-cli -a <password>

# Check memory usage
docker-compose exec redis redis-cli -a <password> INFO memory

# Monitor commands
docker-compose exec redis redis-cli -a <password> MONITOR

# Flush cache (careful!)
docker-compose exec redis redis-cli -a <password> FLUSHALL
```

**Usage:**

- Session storage
- API response caching
- Rate limiting
- Pub/Sub for real-time updates

### Nginx

**Configuration:** `.docker/nginx/`

```bash
# Test configuration
docker-compose exec nginx nginx -t

# Reload configuration
docker-compose exec nginx nginx -s reload

# View access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# View error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

---

## Monitoring

### Health Checks

```bash
# Automated health check script
./scripts/docker-health-check.sh

# Manual checks
docker-compose ps                    # Container status
docker stats                         # Resource usage
docker system df                     # Disk usage
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Follow with timestamps
docker-compose logs -f -t app
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Disk usage
docker system df -v

# Container inspection
docker inspect <container-id>
```

### Metrics (Prometheus)

Add to `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus
  ports:
    - '9090:9090'
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - '3001:3000'
  volumes:
    - grafana-data:/var/lib/grafana
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in docker-compose.yml
```

#### 2. Container Won't Start

```bash
# Check logs
docker-compose logs <service>

# Check exit code
docker-compose ps

# Inspect container
docker inspect <container-id>

# Try manual start
docker-compose up <service>
```

#### 3. Database Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check connection string in .env
# Format: mongodb://user:pass@mongodb:27017/db

# Test connection
docker-compose exec app node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"
```

#### 4. Out of Disk Space

```bash
# Clean up unused resources
docker system prune -a --volumes

# Remove specific resources
docker volume prune
docker image prune -a
docker container prune
```

#### 5. Build Failures

```bash
# Clear build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check .dockerignore
cat .dockerignore
```

### Debug Mode

```bash
# Run container in debug mode
docker-compose run --rm app sh

# Override entrypoint
docker-compose run --rm --entrypoint sh app

# Attach to running container
docker attach <container-id>
```

### Health Check Failures

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' <container-id> | jq

# View health logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container-id>

# Manual health check
docker-compose exec app curl http://localhost:3000/health
```

---

## Best Practices

### Security

- ✅ Never commit `.env` files
- ✅ Use strong, unique passwords
- ✅ Run containers as non-root users (implemented)
- ✅ Keep base images updated
- ✅ Scan images for vulnerabilities
- ✅ Use secrets management in production
- ✅ Enable SSL/TLS in production

### Performance

- ✅ Use multi-stage builds (implemented)
- ✅ Leverage build cache
- ✅ Minimize image layers
- ✅ Use `.dockerignore` (implemented)
- ✅ Set resource limits (implemented in prod)
- ✅ Use named volumes for persistence
- ✅ Enable health checks (implemented)

### Development

- ✅ Use volume mounts for hot reload
- ✅ Keep dev and prod configs separate
- ✅ Use Docker Compose profiles
- ✅ Tag images with version numbers
- ✅ Document all configuration
- ✅ Automate testing with CI/CD

### Maintenance

```bash
# Regular cleanup (weekly)
docker system prune -a --volumes --filter "until=24h"

# Backup volumes (daily)
docker run --rm \
  -v alejandro_mongodb-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mongodb-$(date +%Y%m%d).tar.gz /data

# Update images (monthly)
docker-compose pull
docker-compose up -d --build
```

---

## FAQ

### Q: How do I update a single service?

```bash
docker-compose up -d --build --no-deps app
```

### Q: How do I access the database from my host?

MongoDB is exposed on `localhost:27017`. Connect with:

```bash
mongosh "mongodb://admin:<password>@localhost:27017/alejandro_db?authSource=admin"
```

### Q: Can I use this in production?

Yes! Use `docker-compose.prod.yml` with proper:

- SSL certificates
- Strong secrets
- Resource limits (already configured)
- Backup strategy
- Monitoring tools

### Q: How do I migrate data between environments?

```bash
# Export from dev
docker-compose exec mongodb mongodump --archive=/tmp/dump.archive

# Copy to host
docker cp <container-id>:/tmp/dump.archive ./

# Import to prod
docker cp ./dump.archive <prod-container-id>:/tmp/
docker-compose -f docker-compose.prod.yml exec mongodb mongorestore --archive=/tmp/dump.archive
```

### Q: How do I scale the application?

```bash
# Development
docker-compose up -d --scale app=3

# Production (already configured with replicas)
# Edit docker-compose.prod.yml and adjust:
deploy:
  replicas: 5  # Increase number
```

### Q: What about monitoring in production?

Add Prometheus + Grafana (see [Monitoring](#monitoring) section) or use cloud solutions:

- AWS CloudWatch
- Azure Monitor
- Google Cloud Monitoring
- Datadog
- New Relic

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices Guide](https://docs.docker.com/develop/dev-best-practices/)
- [Production Deployment](https://docs.docker.com/engine/swarm/)

---

**Last Updated:** November 17, 2025
**Maintained by:** NEXUS V1 Team
**Status:** 🟢 Production Ready - Nivel Dios

