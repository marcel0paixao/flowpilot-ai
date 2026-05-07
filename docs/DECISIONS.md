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

## 2026-05-01: Persist Execution Requests Before Publishing Commands

Decision: Add `WorkflowExecution` persistence and have the API create a `PENDING` execution before publishing `workflow.execution.requested`.

Reason: A workflow run needs a durable local record before asynchronous processing starts. Persisting first gives users and future workers a stable `executionId`, supports idempotency, and creates the base for status tracking, retries, audit history, and observability.

## 2026-05-01: Publish Through Declared RabbitMQ Topology

Decision: Replace the simple Nest `ClientRMQ` publisher with an `amqplib`-backed messaging helper that declares FlowPilot exchanges, queues, and bindings, then publishes commands/events to their intended topic exchanges.

Reason: The default `ClientRMQ` flow routed messages through an API-owned queue instead of the documented command/event topology. Direct exchange publishing makes RabbitMQ behavior match the shared contracts: `workflow.execution.requested` goes to `flowpilot.commands` and reaches `flowpilot.execution-worker.workflow-executions`, while lifecycle events go to `flowpilot.events`.

## 2026-05-02: First Worker Updates State Before Publishing Events

Decision: The first execution worker consumes `workflow.execution.requested`, updates the execution state in PostgreSQL, and then publishes lifecycle events to RabbitMQ.

Reason: PostgreSQL remains the durable source of truth for execution state. Publishing `workflow.execution.started` and `workflow.execution.completed` after state changes keeps downstream consumers informed while preserving a reliable execution record for API reads and future recovery behavior.

## 2026-05-03: Worker Retries Are Broker-Scheduled And Terminal Failures Are Explicit

Decision: The execution worker now treats terminal execution statuses as idempotent no-ops, schedules retryable failures through dedicated RabbitMQ retry queues, and marks exhausted/non-retryable executions as `FAILED` while publishing `workflow.execution.failed` and a dead-letter copy of the command.

Reason: Workflow execution can be retried or redelivered, so the worker must avoid duplicate terminal side effects and make failure state durable. Broker-scheduled retry queues keep temporary failures out of tight requeue loops, while explicit failed events and DLQ copies preserve auditability for operators and future observability services.

## 2026-05-03: Worker Lifecycle Events Use A Database Outbox

Decision: Persist execution-worker lifecycle events in an `OutboxMessage` table before publishing them to RabbitMQ, keyed by lifecycle idempotency keys such as `workflow.execution.completed:<executionId>`.

Reason: Status updates and event publication cross two durable systems: PostgreSQL and RabbitMQ. The outbox record makes event publication recoverable if the worker crashes after a database transition but before broker publication, and it gives duplicate deliveries a durable way to resume pending lifecycle event dispatch instead of re-emitting arbitrary new events.

## 2026-05-03: Worker Owns Initial Outbox Dispatch Recovery

Decision: Add a periodic dispatcher loop inside the execution worker that publishes pending `OutboxMessage` rows and marks them `PUBLISHED`, with failed publish attempts tracked on the outbox row.

Reason: The worker is currently the only producer of execution lifecycle outbox events, so local ownership keeps the recovery path simple while the system is still small. A dedicated outbox dispatcher service can be introduced later if multiple producers need shared recovery, scheduling, or operational controls.

## 2026-05-04: Workflow Service Persists Execution Timeline Events

Decision: Add `WorkflowExecutionEvent` rows and have `workflow-service` consume `workflow.execution.*` events from RabbitMQ to persist execution timeline entries idempotently by `eventId`.

Reason: `WorkflowExecution` stores current state, but product and observability views need an ordered history of lifecycle events. Persisting lifecycle events in workflow-service makes execution timelines queryable without coupling API reads directly to transient RabbitMQ queues.

## 2026-05-04: API Exposes Persisted Execution Timelines

Decision: Expose execution timeline events through `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/events`, backed by `WorkflowExecutionEvent` and protected by the same read roles as workflow execution details.

Reason: Clients need a stable HTTP read model for execution history instead of reading RabbitMQ queues. Keeping the route nested under workspace, workflow, and execution preserves tenant scoping and makes the API contract match the domain hierarchy.

## 2026-05-04: Workflow Definition Contract Before Node Runtime

Decision: Define a shared `WorkflowDefinition` contract in `packages/contracts` before implementing `WorkflowNodeExecution`. The first supported node types are `trigger.manual`, `action.transform`, and `action.httpRequest`; definitions must include at least one manual trigger, unique node/edge IDs, valid edge references, reachable nodes, no trigger incoming edges, and an acyclic graph.

Reason: Node execution records need a reliable node shape to point at. Validating workflow definitions at API boundaries keeps invalid JSON out of persisted workflow versions and gives the execution worker a stable contract for the next runtime slice.

## 2026-05-04: Node Lifecycle Event Names Are Workflow-Scoped

Decision: Use `workflow.node.execution.started`, `workflow.node.execution.completed`, and `workflow.node.execution.failed` for future node lifecycle events.

Reason: The events describe node progress inside a workflow execution, so the routing keys should stay under the workflow domain rather than using top-level `node.execution.*` names.

## 2026-05-04: Persist Node Execution Progress Separately

Decision: Add `WorkflowNodeExecution` as a separate table related to `WorkflowExecution`, with node identity, node type, status, input, output, error, and timestamps.

Reason: The workflow execution row should keep the aggregate status of the whole run, while node execution rows capture per-step progress for worker recovery, API reads, timeline/debug views, and the future front-end execution monitor.

## 2026-05-04: First Node Runtime Is Sequential And Deterministic

Decision: The first execution-worker node runtime loads the persisted `WorkflowVersion.definition`, orders the validated DAG from the manual trigger, executes nodes sequentially, persists each node transition in `WorkflowNodeExecution`, and emits node lifecycle events through the existing outbox path. The initial `action.httpRequest` executor is mocked instead of performing network I/O.

Reason: Sequential execution is enough to prove the workflow engine path end to end while keeping concurrency, branching, credentials, and external network behavior out of the first runtime slice. Mocking HTTP keeps local tests and demos deterministic until connector security and retry semantics are designed.

## 2026-05-05: Execution Summary API For Front-End Reads

Decision: Add `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/summary` to return execution details, node progress, and timeline events in one response.

Reason: The first execution detail UI should not need to stitch three API calls together just to render one screen. A compact read model keeps the front-end simpler while preserving the more granular execution, node, and event endpoints for targeted use cases.

## 2026-05-05: React/Vite SPA For The Authenticated Web App

Decision: Build `apps/web` as a React + Vite + TypeScript single-page app with React Router, TanStack Query, Tailwind CSS, shadcn/ui-style local components, lucide-react, React Hook Form, Zod, and React Flow. Do not use Next.js, Redux, or micro-frontends for this stage.

Reason: FlowPilot's main surface is an authenticated SaaS dashboard and workflow builder backed by a separate NestJS API. The app does not need SSR, SEO, Server Components, or deployment-time route splitting yet. A Vite SPA keeps the feedback loop fast, makes API boundaries explicit, and lets the workflow canvas be a first-class React Flow editor instead of an embedded iframe.

## 2026-05-05: Read-Only Canvas Before Editable Workflow Builder

Decision: Render persisted workflow definitions in React Flow read-only mode first, mapping `definition.nodes` and `definition.edges` from the shared contract into canvas nodes and edges with a side inspector.

Reason: The backend already validates and executes workflow definitions. A read-only canvas proves the frontend can consume that contract safely before adding drag-and-drop, node editing, edge creation, and save semantics.

## 2026-05-06: Frontend Integration Tests Before Broad Unit Coverage

Decision: Add a small Vitest, React Testing Library, and MSW integration-test layer for the web app before broad frontend unit tests.

Reason: The highest early frontend risk is route/auth/API wiring rather than isolated component logic. Covering protected-route redirects, login token persistence, authenticated API headers, and workspace rendering gives useful confidence while keeping the test suite lightweight during MVP UI iteration.

## 2026-05-06: Keep Execution Detail On Polling For MVP

Decision: Keep execution detail polling the summary endpoint every 2 seconds while executions are non-terminal.

Reason: The summary endpoint already provides execution, node progress, and timeline state in one read model. Polling is simple, observable, and sufficient for the MVP; SSE or WebSocket updates can be revisited after the workflow builder and execution UX stabilize.

## 2026-05-07: Workflow Builder Saves Immutable Versions

Decision: Editable workflow definition saves create a new `WorkflowVersion` row instead of mutating the current version in place.

Reason: Workflow executions already point at a specific `WorkflowVersion`, so immutable versions preserve replayability, auditability, and historical execution semantics. Draft/publish semantics can be introduced later, but the MVP builder should not rewrite definitions that previous or running executions depend on.

## 2026-05-07: MVP Builder Uses Shared Contract Validation Client And Server Side

Decision: The web builder validates draft definitions with `workflowDefinitionSchema` before save, and the API validates the same payload again before creating a new version.

Reason: Client-side validation gives immediate feedback while server-side validation remains the source of truth. Sharing the contract keeps supported node types, edge rules, reachability, and acyclic graph requirements aligned across the canvas, API, and execution worker.

## 2026-05-07: Builder Node Creation Does Not Auto-Connect

Decision: Adding a node in the builder places it disconnected. The user chooses source and target by connecting React Flow handles manually.

Reason: Auto-connecting new nodes made the builder feel constrained and obscured the graph model. Disconnected insertion is more predictable for an editor: the shared contract validation can block unreachable nodes at save time, while the canvas gives users freedom to choose the actual graph topology.

## 2026-05-07: Version Restore Creates Another Immutable Version

Decision: Restoring an older workflow version creates a new latest `WorkflowVersion` copied from the selected historical definition.

Reason: Version history should stay append-only. A restore is itself a new decision in time, so it should not move or mutate old rows; executions that reference older versions remain historically accurate.
