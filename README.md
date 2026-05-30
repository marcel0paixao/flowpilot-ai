# FlowPilot AI

Multi-tenant workflow automation platform with RabbitMQ execution, Python AI orchestration, OpenRouter-backed LLM nodes, encrypted credentials, and AI observability.

## Purpose

FlowPilot AI is an original portfolio project designed to demonstrate hands-on experience with distributed systems, workflow orchestration, AI integrations, queue-based execution, and production-minded backend architecture.

The project is inspired by common enterprise automation patterns, but it does not copy proprietary code, internal names, private infrastructure, or confidential implementation details from any company or organization.

## Core Capabilities

- Multi-tenant workspaces and role-based access control
- Workflow definition, versioning, execution, and history
- RabbitMQ-based asynchronous execution
- Redis for cache, rate limiting, locks, and temporary runtime state
- Visual workflow builder with manual trigger, transform, condition, HTTP request, and AI prompt nodes
- Python/FastAPI AI Orchestrator with deterministic and OpenRouter providers
- Workspace-scoped encrypted credentials for model providers
- LLM observability with traces, latency, token usage, status, and estimated cost
- Docker Compose local development environment
- Architecture documentation suitable for interviews and portfolio review

Planned AI/data science capabilities include LangChain orchestration, RAG over documents, local model comparison with Ollama, benchmark exports, EDA notebooks, and simple model recommendation based on cost, latency, reliability, and quality.

## Planned Services

| Service | Responsibility |
|---|---|
| Web App | React/Vite dashboard, workflow UI, execution views |
| Auth/API Service | Users, workspaces, JWT, RBAC, public REST API |
| Workflow Service | Workflow definitions, triggers, executions, node metadata |
| Execution Worker | Consumes RabbitMQ jobs and executes workflow nodes |
| AI Orchestrator | Python/FastAPI service for deterministic and OpenRouter prompt execution, with LangChain/RAG/provider expansion planned |
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

This repository is set up as a TypeScript-first pnpm workspace with a Python/FastAPI AI orchestrator service under `apps/ai-orchestrator`.

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm check
```

`docker compose up -d` starts PostgreSQL, RabbitMQ, Redis, Qdrant, the API service, web app, execution worker, workflow service, and AI orchestrator. The API will be available at `http://localhost:3000`, with health checks at `http://localhost:3000/api/health` and Swagger documentation at `http://localhost:3000/docs`. The AI orchestrator exposes `GET /health` and `POST /v1/prompts/run` at `http://localhost:8000`.

Run the AI orchestrator checks inside Docker:

```bash
docker compose run --rm ai-orchestrator python -m pytest
docker compose run --rm ai-orchestrator python -m ruff check .
```

Seed repeatable demo data after PostgreSQL is running:

```bash
pnpm --filter @flowpilot/api seed:demo
```

The demo seed creates `Acme Automation`, a `Lead Enrichment` workflow, the portfolio workflow `Demo - Real AI Incident Triage`, and `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER` users. All demo users use the password `correct horse battery staple`.

Run API integration tests against a local PostgreSQL test database:

```bash
docker compose up -d postgres
pnpm --filter @flowpilot/api test:integration
```

The integration test script creates `flowpilot_test` when needed, applies Prisma migrations, and runs the HTTP flow against the Nest/Fastify app.

## Quality Checks

The repository includes GitHub Actions CI for the portfolio/MVP release:

- TypeScript monorepo install, Prisma validate/generate, lint, typecheck, tests, and build.
- API integration tests against PostgreSQL.
- Python AI Orchestrator Ruff and Pytest checks.

See [CI](docs/CI.md) for the workflow structure and local equivalents.

Initial workspace endpoints:

- `POST /api/workspaces` - requires a bearer token and creates an `OWNER` membership for the authenticated user.
- `GET /api/workspaces` - requires a bearer token and returns only workspaces where the user is a member.
- `GET /api/workspaces/:id` - requires a bearer token and a workspace role.
- `GET /api/workspaces/:id/members` - requires a bearer token and a workspace role.
- `POST /api/workspaces/:id/members` - requires `OWNER` or `ADMIN`.
- `PATCH /api/workspaces/:id/members/:memberId` - requires `OWNER` or `ADMIN`.
- `DELETE /api/workspaces/:id/members/:memberId` - requires `OWNER` or `ADMIN`.

Initial workflow endpoints:

- `POST /api/workspaces/:workspaceId/workflows` - requires `OWNER`, `ADMIN`, or `MEMBER`.
- `GET /api/workspaces/:workspaceId/workflows` - requires a workspace role.
- `GET /api/workspaces/:workspaceId/workflows/:workflowId` - requires a workspace role.
- `GET /api/workspaces/:workspaceId/workflows/:workflowId/versions` - requires a workspace role and returns version history.
- `POST /api/workspaces/:workspaceId/workflows/:workflowId/versions` - requires `OWNER`, `ADMIN`, or `MEMBER` and saves a new immutable workflow definition version.
- `POST /api/workspaces/:workspaceId/workflows/:workflowId/versions/:versionId/restore` - requires `OWNER`, `ADMIN`, or `MEMBER` and restores a prior version by creating a new immutable version.

Initial auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

RabbitMQ management UI will be available at `http://localhost:15672` with the local credentials from `.env.example`.

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AI Orchestrator](docs/AI_ORCHESTRATOR.md)
- [AI Orchestrator Status](docs/AI_ORCHESTRATOR_STATUS.md)
- [Demo Guide](docs/DEMO_GUIDE.md)
- [Portfolio Demo Case Study](docs/PORTFOLIO_DEMO_CASE_STUDY.md)
- [Portfolio Launch Brief PT-BR](docs/PORTFOLIO_LAUNCH_BRIEF_PT_BR.md)
- [Portfolio Release Checklist](docs/PORTFOLIO_RELEASE_CHECKLIST.md)
- [CI](docs/CI.md)
