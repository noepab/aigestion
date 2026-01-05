# AI Integration Guide

## Overview
The **AIService** is the brain of AIGestion, powered by **Google Gemini 2.0 Flash**. It is designed as an autonomous agent capable of using tools to interact with the system and the external world.

## Core Concept: Tool Use
Instead of hardcoding logic, we give the LLM "Tools". The model decides when to call a tool based on the user's prompt.

### Available Tools
1.  **`get_revenue_analytics`**:
    - **Purpose**: Retrieves internal revenue data.
    - **Trigger**: "Show me the revenue", "How much did we make?"
2.  **`get_user_growth`**:
    - **Purpose**: Retrieves user acquisition metrics.
    - **Trigger**: "User growth stats", "Are we growing?"
3.  **`search_web`**:
    - **Purpose**: Real-time external knowledge (Powered by Tavily/SearchService).
    - **Trigger**: "Latest news on AI", "Who is the CEO of Google?"
4.  **`get_codebase_context` (RAG)**:
    - **Purpose**: Reads the project's own source code.
    - **Trigger**: "Explain auth logic", "How does the caching work?", "Examine server.ts".

## Architecture
- **AIService (`src/services/ai.service.ts`)**:
    - Manages the Gemini Chat Session.
    - Defines the `tools` schema passed to the model.
    - Executes the tool logic when the model requests it.
    - Streams the response back to the client (Server-Sent Events style text deltas).

## RAG (Retrieval-Augmented Generation)
- **RagService (`src/services/rag.service.ts`)**:
    - **Premium Features**:
        - **⚡ In-Memory Caching**: 5-minute TTL cache for instant responses (<2ms) on repeated queries.
        - **🗺️ ASCII Tree Visualization**: Prepends a visual map of the project structure (`src/controllers/...`) to the context. This helps the AI understand architecture before reading individual files.
        - **🧠 Smart Filtering**: Ignores noise (`node_modules`, `.git`, `.trunk`) and safely handles large directories.
    - **Flow**: Scans `backend/` -> Generates Tree -> Reads Files -> Returns XML-tagged Context.

## Adding a New Tool
1.  **Define Tool Schema**: Add the JSON schema to `getTools()` in `AIService`.
2.  **Implement Logic**: Add the handler in `streamChat` inside the `if (functionCalls)` block.
3.  **Inject Dependencies**: If the tool needs a new service, inject it into `AIService`.
