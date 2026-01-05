docker-compose build
docker-compose up -d
docker-compose exec mongodb mongosh -u admin -p <password>
docker-compose exec mongodb mongodump --out /backup
db.users.find()
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose exec app sh
docker-compose ps mongodb
docker-compose exec app node -e "require('mongoose').connect(process.env.MONGODB_URI)"
docker builder prune -a
docker-compose build --no-cache
docker system prune -a --volumes

<!-- Condensed AI agent instructions (keep concise: ~40 lines). Original verbose reference removed to reduce noise. -->

# NEXUS V1 (Autogestión Pro) – Copilot Agent Guide

## Core Picture

Full‑stack TypeScript: React + Vite (`components/`, `contexts/`) and Express + Socket.IO (`server/src`). Supporting services: MongoDB, RabbitMQ, Redis, Python evaluation (`evaluation/`). Containers & orchestration via `docker-compose*.yml` and `k8s/`. CI workflows in `.github/workflows/` build, test, scan, publish.

## Architectural Boundaries

Frontend: state via existing React Contexts (e.g. `AuthContext`, `CartContext`).
Backend: layered `config/`, `middleware/`, `models/`, `controllers/`, `routes/`, `utils/` – respect separation (do not put business logic in routes).
Evaluation: Python isolated; communicate through queue (`evaluation.tasks`).
Cross‑service messaging: RabbitMQ queues (`evaluation.tasks`, `container.events`, `notifications`).
Caching & rate limiting: Redis; do not duplicate in-memory caches in Node.

## Critical Conventions

Path alias `@/` (frontend + shared) – prefer `import { Header } from '@/components/Header'`.
Env: Frontend requires `VITE_` prefix; backend plain names (`GEMINI_API_KEY`, `JWT_SECRET`). Never invent new prefixes.
Tests: Backend Jest scripts in `server/package.json`; frontend test runner via Vite config. Keep new tests colocated (`__tests__` or `*.test.ts`).
Commits: Conventional commit categories (`feat`, `fix`, `refactor`, etc.).

## When Adding Code

Reuse contexts; do not create parallel auth/cart providers.
Add new data models under `server/src/models` with matching controller + route; export lean DTOs (avoid leaking Mongoose docs to response).
Queue producers/consumers: place consumer logic under `server/src/utils` or `server/src/services` (if exists) – avoid embedding in controllers.
Socket.IO events: extend existing pattern (`joinRoom`, `leaveRoom`) – keep names verbs, no camelCase with capitals.

## Environment & Run

Dev (Docker): `docker-compose up -d` (hot reload via mounted volumes). No rebuild for pure code changes; rebuild only after dependency or Dockerfile edits.
Bare metal: start backend in `server` (`npm run dev`), frontend root (`npm run dev`). Ensure `.env` present before either.
Health checks: `/health` (backend), root port 5173 (frontend). Use scripts: `./scripts/docker-health-check.sh`, `./scripts/k8s-health-check.sh`.

## Integration Points

Gemini API (`@google/genai`) accessed via service wrapper (check existing usage before adding direct calls). Fallback gracefully on error (log + user‑visible neutral state).
Authentication: JWT via middleware (`auth.middleware.ts`); do not manually decode tokens in controllers.
MongoDB URI must include `authSource=admin` for authenticated containers.

## Security & Reliability

Middlewares: Helmet, rate limiting, mongo‑sanitize, xss‑clean, HPP already applied – add new security middleware only if gap identified.
Avoid raw user input in queue routing keys; validate before enqueue.
Run Trivy scan locally for new base image changes (`security-scan` job mirrors CI expectations).

## Kubernetes (High Level)

Stateful services use StatefulSets; avoid altering volume claim names casually. App deployments in `k8s/*deployment.yaml`; keep container ports consistent (3000 backend, 5173 frontend).

## Quick Commands

Start dev: `docker-compose up -d`
Logs (app): `docker-compose logs -f app`
Tests (backend): `cd server && npm test`
Queue list: `docker-compose exec rabbitmq rabbitmqctl list_queues`
Mongo shell: `docker-compose exec mongodb mongosh -u admin -p <password>`

## AI Agent Gotchas

1. Check Docker status before suggesting container ops.
2. Do not duplicate contexts or create alternate store libraries.
3. Keep responses lean: convert Mongoose doc to plain object before sending.
4. Prefer existing utility patterns under `server/src/utils` for logging & error wrapping.
5. Use existing env variable names; propose additions only with justification.
6. Multi-stage Dockerfile means dependency layer changes trigger full rebuild; mention this to user if altering dependencies.
7. Queue consumers must ack/nack explicitly (review existing pattern before adding).

## Clarification Needed

Repository owner phrase received: "nemisanalex no noepab" – confirm if ownership/name references in docs should change (e.g. update container image namespace, GitHub org). Please specify desired canonical owner identifier.

## Extend Further

For deeper operations (backup, troubleshooting, CI job details) consult original expanded docs: `DOCKER.md`, `PROJECT_STRUCTURE.md`, `CONTRIBUTING.md`.

<!-- End condensed instructions -->

