# Roadmap

## Week 1: Foundation

- Define architecture, service boundaries, and event contracts.
- Create monorepo structure.
- Add Docker Compose with PostgreSQL, RabbitMQ, Redis, and vector store.
- Add initial README and architecture documentation.

## Week 2: Auth and Multi-Tenancy

- Implement users, workspaces, roles, and permissions.
- Add JWT authentication with workspace and role claims.
- Add tenant-aware middleware.
- Use Redis for permission cache and rate limiting.

## Week 3: Workflow Core

- Model workflows, nodes, edges, triggers, and executions.
- Add CRUD APIs for workflows.
- Implement first simple node types: HTTP request, transform, condition, and response.

## Week 4: RabbitMQ and Workers

- Add event contracts for workflow execution.
- Publish execution requests to RabbitMQ.
- Implement worker consumers.
- Add retries, dead-letter queues, idempotency keys, and failure handling.

## Week 5: AI Orchestrator

- Add LangChain service.
- Implement chat completion, RAG, memory, and basic tool calling.
- Add provider abstraction for OpenAI, Anthropic, or local models.
- Persist conversations, prompts, and document references.

## Week 6: Observability

- Add trace model for workflow and AI execution.
- Capture prompt, response, model, token usage, latency, status, and errors.
- Integrate Langfuse or implement a lightweight internal trace dashboard.
- Add correlation IDs across services.

## Week 7: Frontend

- Build workspace dashboard.
- Build workflow list and detail views.
- Build execution timeline view.
- Build AI trace view.
- Start with forms or JSON workflow editing before adding a canvas editor.

## Week 8: Real Integrations

- Add webhook trigger.
- Add HTTP request node.
- Add notification or email mock node.
- Add document ingestion for RAG.
- Build a complete demo workflow.

## Week 9: Quality and DevOps

- Add unit and integration tests.
- Add service health checks.
- Add Dockerfiles per service.
- Add GitHub Actions CI.
- Add seed data and demo scripts.

## Week 10: Portfolio Polish

- Add C4 diagrams.
- Record a short demo video.
- Add architecture decision records.
- Add resume-ready impact statements.
- Prepare public GitHub release.

## Estimated Effort

- MVP: 120-160 hours
- Strong interview-ready project: 220-280 hours
- Senior-level showcase: 320-420 hours

Recommended target: 280 hours.

