# FlowPilot AI

Multi-tenant workflow automation platform with microservices, RabbitMQ, Redis, LangChain, RAG, and LLM observability.

## Purpose

FlowPilot AI is an original portfolio project designed to demonstrate hands-on experience with distributed systems, workflow orchestration, AI integrations, queue-based execution, and production-minded backend architecture.

The project is inspired by common enterprise automation patterns, but it does not copy proprietary code, internal names, private infrastructure, or confidential implementation details from any company or organization.

## Core Capabilities

- Multi-tenant workspaces and role-based access control
- Workflow definition, versioning, execution, and history
- RabbitMQ-based asynchronous execution
- Redis for cache, rate limiting, locks, and temporary runtime state
- LangChain-powered AI orchestration
- RAG over uploaded documents
- LLM observability with traces, latency, token usage, and estimated cost
- Docker Compose local development environment
- Architecture documentation suitable for interviews and portfolio review

## Planned Services

| Service | Responsibility |
|---|---|
| Web App | Next.js dashboard, workflow UI, execution views |
| Auth/API Service | Users, workspaces, JWT, RBAC, public REST API |
| Workflow Service | Workflow definitions, triggers, executions, node metadata |
| Execution Worker | Consumes RabbitMQ jobs and executes workflow nodes |
| AI Orchestrator | LangChain, RAG, memory, tools, provider abstraction |
| Observability Service | AI traces, execution logs, metrics, cost analytics |
| Integration Service | Webhooks, HTTP requests, notifications, external adapters |

## Local Infrastructure

- PostgreSQL for transactional data
- RabbitMQ for service-to-service events and background execution
- Redis for cache and runtime coordination
- Qdrant or pgvector for vector search
- Optional Langfuse for LLM tracing

## Monorepo Structure

```txt
apps/
  web/
  api/
  workflow-service/
  execution-worker/
  ai-orchestrator/
  observability-service/
packages/
  contracts/
  config/
  logger/
docs/
  contracts/
```

## Local Development

This repository is set up as a TypeScript-first pnpm workspace.

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm check
```

`docker compose up -d` starts PostgreSQL, RabbitMQ, Redis, Qdrant, and the API service. The API will be available at `http://localhost:3000`, with health checks at `http://localhost:3000/api/health` and Swagger documentation at `http://localhost:3000/docs`.

Initial workspace endpoints:

- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/:id`

Initial auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`

RabbitMQ management UI will be available at `http://localhost:15672` with the local credentials from `.env.example`.

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Status](docs/STATUS.md)
- [Decisions](docs/DECISIONS.md)
- [Next Steps](docs/NEXT_STEPS.md)
