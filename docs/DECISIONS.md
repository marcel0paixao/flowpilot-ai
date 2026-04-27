# Decisions

## 2026-04-27: Project Name

Decision: Use `flowpilot-ai` as the repository name and FlowPilot AI as the product name.

Reason: The name is short, readable, and communicates workflow orchestration plus AI.

## 2026-04-27: RabbitMQ as Main Broker

Decision: Use RabbitMQ for microservice messaging and asynchronous workflow execution.

Reason: The project should demonstrate explicit message broker experience beyond Redis-backed queues.

## 2026-04-27: Redis Scope

Decision: Use Redis for cache, rate limiting, locks, and temporary state rather than the main workflow queue.

Reason: This shows a cleaner separation of responsibilities and avoids making Redis the central microservice broker.

## 2026-04-27: Documentation as Chat Handoff

Decision: Keep `STATUS.md`, `DECISIONS.md`, and `NEXT_STEPS.md` updated at the end of every work session.

Reason: This allows a new chat to continue the project without depending on prior conversation history.

## 2026-04-27: TypeScript-First pnpm Monorepo

Decision: Use a TypeScript-first monorepo with pnpm workspaces, `apps/*` for deployable services, and `packages/*` for shared contracts and utilities.

Reason: This keeps the first implementation cohesive, reduces setup overhead, and still leaves room to add Python later for AI experiments if that becomes valuable.

## 2026-04-27: Qdrant for Initial Vector Store

Decision: Start local vector search with Qdrant in Docker Compose.

Reason: A separate vector store makes the RAG architecture explicit for portfolio and interview discussion. pgvector remains a possible later simplification.

## 2026-04-27: Shared Event Contracts Package

Decision: Define initial RabbitMQ event payloads in `packages/contracts` and document them in `docs/contracts/events.md`.

Reason: Event contracts are a core integration boundary between the workflow service, execution worker, AI orchestrator, and observability service.
