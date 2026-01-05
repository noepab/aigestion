# API Documentation v1

Base URL: `/api/v1`

## System Endpoints

### `POST /system/credentials/verify`
Verifies all configured credentials and API keys (Stripe, Google, etc.).
- **Tags**: System
- **Responses**:
  - `200`: Verification report (JSON).
  - `500`: Verification failed.

### `GET /system/history/{metric}`
Retrieves history snapshots for a specific system metric.
- **Tags**: System
- **Parameters**:
  - `metric` (path): Name of the metric (e.g., `cpu`, `memory`).
- **Responses**:
  - `200`: List of metric snapshots.

## Utility Endpoints

### `GET /health`
Health check endpoint used by uptime monitors and load balancers.
- **Tags**: Utility
- **Responses**:
  - `200`: JSON with status `healthy`, timestamp, uptime, and version.

## AI Endpoints (`/ai`)

### `POST /ai/prompt`
Sends a prompt to the AI Engine.
- **Body**: `{ "prompt": "string" }`
- **Responses**:
  - `200`: `{ "success": true, "data": "AI Response..." }`

## User Endpoints (`/users`)
*Documentation generated from router mount.*

## Integrations

### `/stripe`
Handles Stripe webhooks and checkout sessions.

### `/youtube`
Handles YouTube data retrieval and channel statistics.

### `/exit-templates`
Generates exit email templates.
