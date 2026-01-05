# NEXUS V1 Swarm: "The Hexagon"

## Overview
The NEXUS V1 Swarm is an autonomous multi-agent system designed to continuously monitor, analyze, and optimize the NEXUS V1 project. It consists of 6 specialized agents working in a feedback loop.

## Architecture

```mermaid
graph TD
    User((User)) -->|Goal| Overlord[Overlord (Manager)]
    Overlord -->|Start Scan| Detective[Detective (Monitor)]
    Detective -->|Issues Found| Overlord
    Overlord -->|Design Solution| Architect[Architect (Planner)]
    Architect -->|Tech Spec| Builder[Builder (Coder)]
    Builder -->|Code Proposal| Critic[Critic (Reviewer)]
    Critic -->|Approved| Mechanic[Mechanic (Verifier)]
    Mechanic -->|Success| Overlord
```

## Agents

1.  **Overlord**: The Manager. Handles state, prioritization, and delegation.
2.  **Detective**: The Monitor. Scans lines of code, logs, and metrics for inefficiencies.
3.  **Architect**: The Planner. Converts issues into technical implementation plans.
4.  **Builder**: The Coder. Writes the actual code changes.
5.  **Critic**: The Reviewer. Validates code for security and correctness.
6.  **Mechanic**: The Verifier. Runs tests and deploys changes.

## Usage

To run a manual optimization cycle:

```bash
cd NEXUS V1-ia-engine/swarm
python main.py
```

## Current Capabilities
- **Scanning**: Detects large files (>500KB) and "TODO" comments.
- **Reporting**: Generates a `SWARM_REPORT.md` (mocked implementation) summarizing the actions.
- **Safety**: Runs in local mode. Editing is currently mocked or limited to generating reports.

## Roadmap
- [ ] Connect to real LLM (Gemini/OpenAI) for intelligent code generation.
- [ ] Enable Github PR creation instead of direct file writes.
- [ ] Add vector database for long-term memory of codebase context.

