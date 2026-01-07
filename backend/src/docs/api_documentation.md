# API Documentation v1

Base URL: `/api/v1`

## Rate Limiting
The API implements **Dynamic Rate Limiting** specifically for resource-intensive endpoints.
- **/ai/*** routes are protected by a granular limiter to prevent abuse and manage costs.
- Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` are provided in responses.

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
