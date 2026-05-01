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

## 2026-04-27: NestJS With Fastify For Backend Services

Decision: Use NestJS with the Fastify adapter for the first backend service implementation.

Reason: NestJS provides module boundaries, dependency injection, guards, interceptors, validation, testing patterns, Swagger support, and microservice integration that match the multi-service SaaS architecture. Fastify keeps the HTTP runtime lightweight and performant.

## 2026-04-27: Zod For Environment Validation

Decision: Use Zod to validate API runtime configuration at startup.

Reason: Zod provides explicit runtime validation with TypeScript-friendly inferred config shapes and keeps invalid local or deployed environments from failing later in request handling.

## 2026-04-27: Prisma 6 For Initial Persistence

Decision: Use Prisma 6 for the initial PostgreSQL persistence layer.

Reason: Prisma gives fast schema iteration, clear migrations, strong generated types, and a familiar portfolio-friendly developer experience. Prisma 6 keeps the standard `schema.prisma` datasource flow while Prisma 7's newer client configuration model would add setup complexity too early.

## 2026-04-27: RabbitMQ Through `@nestjs/microservices`

Decision: Start RabbitMQ integration through `@nestjs/microservices`.

Reason: It is enough for the first service boundary and keeps messaging consistent with NestJS modules. If workflow execution later needs finer control over exchanges, acknowledgements, retries, and dead-letter behavior, the project can introduce a lower-level RabbitMQ adapter.

## 2026-04-28: Workspace Membership As RBAC Foundation

Decision: Model tenant access through `WorkspaceMember`, linking `Workspace` and `User` with a `WorkspaceRole` enum.

Reason: Users may belong to multiple workspaces with different permissions. A membership table keeps the multi-tenant boundary explicit and gives auth/JWT a clear place to derive workspace-scoped roles later.

## 2026-04-28: Explicit Nest Injection In TSX Dev Runtime

Decision: Use explicit `@Inject(...)` on API constructors that rely on dependency injection.

Reason: The development runtime uses `tsx watch`, and explicit injection avoids relying on decorator metadata behavior across ESM/transpilation paths.

## 2026-04-28: JWT With Workspace Role Claims

Decision: Issue JWT access tokens containing user identity plus optional `workspaceId` and `role` claims.

Reason: The API is multi-tenant, so downstream guards and services need workspace-scoped authorization context rather than only user identity.

## 2026-04-28: bcryptjs For Initial Password Hashing

Decision: Use `bcryptjs` for password hashing in the first auth slice.

Reason: It avoids native module build friction in local Docker and Codex environments while still providing bcrypt-compatible password hashing. A native implementation can be revisited later if performance becomes relevant.

## 2026-04-28: Workspace RBAC Enforced From Database Membership

Decision: Validate workspace access through `WorkspaceMember` at request time instead of trusting only the JWT role claim.

Reason: JWT claims are useful request context, but database-backed membership checks prevent stale or forged workspace access from becoming the source of truth. The token identifies the user; the guard confirms tenant membership and required role before serving workspace-scoped resources.

## 2026-04-28: Conservative Workspace Member Management

Decision: Add workspace member management with conservative role transitions. `OWNER` and `ADMIN` can manage members, but member management cannot assign, remove, or change `OWNER`. `ADMIN` can manage `MEMBER` and `VIEWER`, but cannot assign or modify `ADMIN`.

Reason: This gives the portfolio project a real RBAC surface while avoiding dangerous ownership-transfer semantics before there is an explicit ownership policy, audit trail, or invitation lifecycle.

## 2026-04-29: Explicit API Response DTOs

Decision: Define explicit response DTO classes for auth, workspace, and workspace member HTTP responses and wire them into Swagger metadata.

Reason: The API should expose intentional contracts instead of leaking persistence implementation details through generated shapes. DTOs keep docs clearer, make response review easier, and give future frontend/integration tests stable targets.

## 2026-04-29: Idempotent Demo Seed

Decision: Add a local demo seed script under `apps/api/prisma` that upserts a workspace and users for each workspace role.

Reason: A repeatable seed keeps local testing and portfolio demos fast without depending on manual curl setup. Upserts make the script safe to rerun while preserving the same public demo credentials.

## 2026-04-29: Docker-Backed API Integration Tests

Decision: Add API integration tests that run the Nest/Fastify app in-process while using a real PostgreSQL database named `flowpilot_test`.

Reason: Unit tests cover service policy, but the API also needs confidence across controllers, validation pipes, guards, JWT verification, Prisma queries, and migrations. A local Docker-backed test database keeps the setup close to development infrastructure without adding another test service yet.

## 2026-04-29: RabbitMQ Naming And Delivery Conventions

Decision: Use topic exchanges named `flowpilot.commands`, `flowpilot.events`, `flowpilot.retry`, and `flowpilot.dlx`; dotted routing keys matching event names; service-owned queues named `flowpilot.<service>.<purpose>`; and a standard JSON envelope with tenant, correlation, causation, producer, and schema metadata.

Reason: Workflow execution will cross service boundaries, so message names, retry behavior, dead-letter handling, idempotency, and trace context must be explicit before implementing workflow persistence and publishers. This keeps the first workflow slice aligned with the future worker and observability services.

## 2026-05-01: Workflow Definitions With Versioned JSON

Decision: Model workflows as workspace-scoped records with a `WorkflowStatus` and separate `WorkflowVersion` rows that store the executable definition as JSON.

Reason: Workflow metadata changes independently from executable definitions. A version table makes future publishing, execution replay, audit trails, and rollback easier while keeping the first API slice small.

## 2026-05-01: Publish `workflow.created` From Workflow Creation

Decision: Add a `workflow.created` message contract and publish it from the API workflow creation path through `MessagingService.publishEvent(...)`.

Reason: Workflow creation is the first domain event that proves the API can emit meaningful workflow lifecycle events. The implementation keeps publishing behind a small service boundary so it can later be upgraded to an outbox-backed or lower-level RabbitMQ publisher without changing workflow business logic.
