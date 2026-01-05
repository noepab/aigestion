# Premium Exit Communication Package

## Overview
This package provides a **premium‑grade** set of tools for generating and sending resignation/exit emails. It includes:
- Four high‑quality markdown templates (formal, friendly, brief, creative).
- A TypeScript service (`exitEmail.service.ts`) to load and render templates.
- An Express controller (`exitEmail.controller.ts`) exposing:
  - `GET /api/exit-templates` – list available template names.
  - `GET /api/exit-templates/:name` – retrieve a raw template (placeholders intact).
- A CLI script (`scripts/exit-email.ts`) for local generation of a rendered email.
- Optional Telegram bot integration to notify a configured chat when a template is rendered.
- Feature‑flag `premiumExitEnabled` to toggle the whole suite.
- Comprehensive unit and integration tests.

## Installation
```bash
# From the project root
npm install
# Install optional Telegram dependency if you plan to use notifications
npm install node-telegram-bot-api
```

## Enabling the Feature
Add the flag to your environment (e.g., `.env`):
```
PREMIUM_EXIT_ENABLED=true
```
The flag is read from `featureFlags.ts` and applied in the route registration.

## Using the API
```http
GET /api/exit-templates          # returns { templates: ["formal","friendly",...] }
GET /api/exit-templates/formal   # returns { content: "# Plantilla Formal ..." }
```
All responses are wrapped with the standard `buildResponse` helper.

## Using the CLI
```bash
npm run exit-email -- --name formal --data '{"nombre":"Juan","jefe":"María","cargo":"Ingeniero","empresa":"Acme Corp","fecha_ultimo_dia":"2026‑02‑01","correo":"juan@example.com","telefono":"+34 600 123 456"}'
```
The script prints the rendered markdown to stdout.

## Telegram Notifications (optional)
1. Create a bot via **@BotFather** and obtain a token.
2. Get the chat ID (e.g., by sending a message to the bot and checking updates).
3. Set environment variables:
```
TELEGRAM_BOT_TOKEN=YOUR_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
NOTIFY_TELEGRAM=true   # enable notifications
```
When `NOTIFY_TELEGRAM` is `true`, rendering a template will trigger a message like:
```
✅ Exit email template "formal" rendered for user Juan.
```

## Workflow for Sending an Email
1. Choose a template (formal, friendly, brief, creative).
2. Fill the placeholders using the CLI or your own UI.
3. Copy the rendered markdown into your email client (Outlook, Gmail, etc.).
4. (Optional) The Telegram bot will send a confirmation to the configured chat.

## Testing
```bash
npm test
```
The test suite covers:
- Service loading and placeholder replacement.
- Controller responses and error handling.
- Telegram integration (mocked).
- Feature‑flag gating.

## Future Enhancements
- Add HTML email rendering.
- Support for additional languages.
- UI component for template preview inside the AIGestion dashboard.
