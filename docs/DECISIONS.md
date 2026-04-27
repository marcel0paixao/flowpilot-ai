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

