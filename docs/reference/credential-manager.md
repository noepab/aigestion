# 🔐 Premium Credential Manager & Alerting

**Version**: 1.0.0
**Date**: January 2026

## Overview
The Premium Credential Manager is a proactive security system that ensures all external integrations in NEXUS V1 are authenticated and operational. It replaces passive failure logging with active, boot-time auditing.

## 🏗 Architecture (InversifyJS)
The system is built using **InversifyJS** for Dependency Injection, ensuring modularity and testability.

### Core Services
1. **`CredentialManagerService`**: The orchestrator. It calls verification methods for each provider.
2. **`GoogleSecretManagerService`**: now an `@injectable` service that handles secure fetching of secrets from GCP.
3. **`TelegramService`**: Enhanced to support direct Admin alerts.

## 🔍 Verification Logic
The system actively tests credentials by making lightweight API calls to providers:
- **Google Cloud**: Checks Project ID and metadata access.
- **Gemini (Vertex AI)**: Verifies API key/ADC configuration.
- **Stripe**: Retrieves balance/account info to validate the Secret Key.
- **Telegram**: calls `getMe` to verify Bot Token.
- **Instagram**: pings the Graph API with the Access Token.

## 🚨 Alerting System
If ANY credential fails validation during server startup:
1. An error is logged on the server.
2. An **Immediate Alert** is sent to the `aigestionnet` Telegram channel.
3. The alert details exactly *which* provider failed and *why* (e.g., `401 Unauthorized`).

## Dashboard API
**Endpoint**: `POST /api/v1/system/credentials/verify`

Allows administrators to trigger an Audit on-demand without restarting the server. Returns a JSON report of all credential statuses.

```json
[
  {
    "provider": "Stripe",
    "status": "valid",
    "lastChecked": "2026-01-04T12:00:00.000Z"
  },
  {
    "provider": "Instagram",
    "status": "invalid",
    "message": "Error validating access token: Session has expired..."
  }
]
```
