# Architecture

## Goal

FlowPilot AI is a portfolio-grade distributed platform for workflow automation and AI orchestration. The architecture is intentionally modular so each service has a clear responsibility and can be discussed independently in interviews.

## High-Level System

```mermaid
flowchart LR
  Web[Web App] --> API[Auth/API Service]
  Web --> Workflow[Workflow Service]
  API --> Postgres[(PostgreSQL)]
  Workflow --> Postgres
  Workflow --> Rabbit[(RabbitMQ)]
  Rabbit --> Worker[Execution Worker]
  Worker --> AI[AI Orchestrator]
  Worker --> Integrations[Integration Service]
  AI --> Vector[(Vector Store)]
  AI --> Redis[(Redis)]
  Worker --> Observability[Observability Service]
  AI --> Observability
  Observability --> Postgres
```

## Service Boundaries

### Web App

React + Vite SPA for workspaces, workflows, workflow builder, executions, and future AI traces.

### Auth/API Service

Owns identity-adjacent application data: users, workspaces, roles, permissions, and JWT issuance or validation.

### Workflow Service

Owns workflow definitions, triggers, execution records, node metadata, and public workflow APIs.

### Execution Worker

Consumes RabbitMQ execution jobs and runs workflow nodes. It is horizontally scalable and isolated from request/response API latency.

### AI Orchestrator

Python/FastAPI service that owns AI-specific execution behavior. The first implementation exposes a deterministic prompt provider over HTTP so `action.aiPrompt` behavior can be tested without external model providers. It will later own LangChain flows, RAG, memory, tools, model provider abstraction, token/cost accounting, and AI trace emission.

Prompt execution is initially modeled as synchronous HTTP because the execution worker needs the AI node output before continuing the workflow DAG. RabbitMQ remains the asynchronous backbone for workflow lifecycle events and is the preferred path for future AI traces, document ingestion, embedding batches, reindexing, and other long-running AI jobs.

### Observability Service

Captures workflow execution logs and LLM traces, including latency, token usage, estimated cost, inputs, outputs, and errors.

### Integration Service

Provides external adapters such as webhook handling, HTTP requests, mock CRM, email, Slack-like notifications, or document ingestion.

## Messaging

RabbitMQ is the main service-to-service broker for asynchronous work.

Initial event names:

- `workflow.execution.requested`
- `workflow.execution.started`
- `workflow.node.execution.started`
- `workflow.node.execution.completed`
- `workflow.node.execution.failed`
- `workflow.execution.completed`
- `workflow.execution.failed`
- `ai.trace.created`

## Redis Usage

Redis should not be the primary queue. It will be used for:

- Permission cache
- Rate limiting
- Short-lived locks
- Temporary execution state
- Optional chat memory cache

## Data Strategy

PostgreSQL stores transactional data. Vector search can use Qdrant or pgvector. The project should start with the simpler option and document the trade-off.

Initial local development uses Qdrant as a separate vector store to make the RAG boundary visible in the architecture. pgvector remains a possible simplification if local operational overhead becomes more important than demonstrating service separation.

## Monorepo Layout

The repository starts as a TypeScript-first pnpm workspace, with `apps/ai-orchestrator` implemented as a separately containerized Python service.

```txt
apps/
  web/                    React + Vite dashboard and workflow builder
  api/                    auth, users, workspaces, roles, permissions, JWT
  workflow-service/       workflow definitions, triggers, executions, node metadata
  execution-worker/       RabbitMQ consumer and node execution runtime
  ai-orchestrator/        Python/FastAPI prompt orchestration, LangChain/RAG later
  observability-service/  workflow logs and LLM traces
packages/
  contracts/              shared RabbitMQ event contracts
  config/                 shared environment config loading
  logger/                 shared structured logger
```

## Local Infrastructure

`docker-compose.yml` defines the first local dependencies:

- PostgreSQL
- RabbitMQ with management UI
- Redis
- Qdrant

Docker Compose also runs the API, web app, execution worker, workflow-service, and Python AI orchestrator for local development. Dedicated production Dockerfiles can still be refined later when deployment shape becomes clearer.

## Security Strategy

- JWT authentication
- Workspace-scoped access
- Role-based permissions
- Tenant-aware query filtering
- No secrets committed to the repository
- Explicit origin handling if iframe or embedded apps are ever introduced
