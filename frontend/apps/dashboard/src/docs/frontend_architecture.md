# Frontend Architecture

## Overview
The **AIGestion Frontend** is a monorepo managed by `turbo` (implied) or `pnpm workspaces`. The core application is the **Dashboard** (`apps/dashboard`), built with **React**, **Vite**, and **TailwindCSS**.

## Key Components

### 1. Nexus Chat Widget (`src/components/widgets/NexusChatWidget.tsx`)
A floating AI assistant interface that connects to the backend RAG service.
- **Features**:
    - Streaming responses (Server-Sent Events style).
    - Markdown rendering.
    - **Premium RAG Visualization**: Automatically detects and renders the ASCII Project Tree in a dedicated code block.
    - Preserves chat history in local state (session).

### 2. API Layer (`src/api/`)
- **`ai.api.ts`**: Handles communication with the backend AI service (`/api/v1/ai/prompt`). Uses `fetch` and `ReadableStream` to process text deltas incrementally.

### 3. State Management
- **Context API**: Used for Role-based access (`RoleContext`) and Network status (`useNetworkStatus`).
- **React Query**: Used for data fetching (inferred from `package.json`).

## Integration
The `NexusChatWidget` is mounted globally in `App.tsx` (Line 164), adhering to the "Always Available" philosophy. It sits above the main content layer (`z-50`).

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Icons**: Lucide React
