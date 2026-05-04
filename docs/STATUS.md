# Status

## Current Phase

Week 1 foundation.

## Completed

- Repository concept defined.
- Name selected: FlowPilot AI.
- Initial documentation structure created.
- Roadmap drafted.
- Architecture direction drafted.
- GitHub repository creation and initial publication.
- TypeScript-first pnpm monorepo scaffold.
- Initial app folders for web, API, workflow service, execution worker, AI orchestrator, and observability service.
- Shared packages for event contracts, runtime config, and structured logging.
- Docker Compose infrastructure for PostgreSQL, RabbitMQ, Redis, and Qdrant.
- `.env.example` with local development defaults.
- Initial RabbitMQ event contract types and documentation.
- `pnpm` installed locally and dependencies installed for the monorepo.
- `apps/api` converted to a NestJS API using the Fastify adapter.
- API configuration validation added with Zod and dotenv.
- API `/api/health` endpoint added.
- Swagger setup added at `/docs`.
- Prisma 6 added with an initial PostgreSQL schema for `Workspace` and `User`.
- RabbitMQ client module added with `@nestjs/microservices`.
- Docker Compose now includes the API service alongside PostgreSQL, RabbitMQ, Redis, and Qdrant.
- Added `amqp-connection-manager`, required by NestJS `ClientRMQ`.
- Added `class-validator` and `class-transformer`, required by NestJS `ValidationPipe`.
- Added `@fastify/static`, required by Swagger static assets on `FastifyAdapter`.
- Added initial Prisma migration for `Workspace`, `User`, `WorkspaceMember`, and `WorkspaceRole`.
- Implemented `WorkspacesModule` with persisted workspace creation, listing, and detail endpoints.
- `POST /api/workspaces` creates a workspace, owner user, and `OWNER` membership in one Prisma transaction.
- Added API unit tests for health and workspace service behavior.
- Added `AuthModule` with `POST /api/auth/register` and `POST /api/auth/login`.
- Added `passwordHash` to `User` with a Prisma migration.
- Added JWT access token issuance with optional `workspaceId` and `role` claims.
- Added `bcryptjs` password hashing.
- Added API unit tests for auth register/login behavior.
- Added `JwtAuthGuard`, `@CurrentUser()`, `@WorkspaceRoles(...)`, and `WorkspaceRolesGuard`.
- Added `GET /api/auth/me` for the authenticated user profile and memberships.
- Protected workspace routes with JWT authentication.
- Scoped `GET /api/workspaces` to the authenticated user's memberships.
- Protected `GET /api/workspaces/:id` with workspace role membership checks.
- Changed `POST /api/workspaces` to create the workspace for the authenticated user as `OWNER`.
- Added explicit safe user selection in workspace responses so `passwordHash` is not exposed.
- Added unit tests for JWT guard, workspace role guard, auth profile, and workspace membership filtering.
- Added workspace membership endpoints for listing, adding, role updates, and removal.
- Added conservative member-management policies: no owner assignment/removal through member management, and admins can only manage member/viewer roles.
- Added unit tests for workspace membership role policy.
- Added explicit response DTO contracts for auth, workspace, and workspace member responses.
- Wired Swagger response metadata to the explicit response DTOs.
- Added an idempotent `pnpm --filter @flowpilot/api seed:demo` script for local demo data.
- Added `pnpm --filter @flowpilot/api test:integration` for HTTP integration tests against a local PostgreSQL test database.
- Added integration coverage for auth, workspace creation, member management, RBAC denial, and cross-tenant denial.
- Defined RabbitMQ exchange, queue, routing key, retry, dead-letter, envelope, correlation, causation, and idempotency conventions in `docs/contracts/events.md`.
- Added RabbitMQ constants, retry policy constants, producer constants, derived messaging types, envelope types, and enveloped message payload types in `packages/contracts`.
- Added `@flowpilot/contracts` messaging tests that keep routing keys aligned with event names and validate naming conventions.
- Added Prisma models and migration for `Workflow`, `WorkflowVersion`, and `WorkflowStatus`.
- Added `WorkflowsModule` with create, list, and detail endpoints nested under workspace routes.
- Added RBAC for workflow routes: create allows `OWNER`, `ADMIN`, and `MEMBER`; read allows all workspace roles.
- Added workflow response/request DTOs and unit tests for workflow service behavior.
- Updated demo seed to create a `Lead Enrichment` workflow with version `1`.
- Added `workflow.created` to the shared messaging contracts.
- Added `MessagingService.publishEvent(...)` and publish `workflow.created` after workflow creation.
- Split messaging DI tokens from `MessagingModule` so messaging services can be unit tested without loading runtime config.
- Added Prisma model and migration for `WorkflowExecution` with `WorkflowExecutionStatus`.
- Added `POST /api/workspaces/:workspaceId/workflows/:workflowId/executions` to persist a pending execution request and publish `workflow.execution.requested`.
- Added workflow execution request/response DTOs and Zod body validation for execution input.
- Replaced the simple Nest `ClientRMQ` publisher with an `amqplib`-backed RabbitMQ publisher/declaration helper.
- API startup now declares `flowpilot.commands`, `flowpilot.events`, `flowpilot.retry`, `flowpilot.dlx`, initial service queues, and bindings.
- `workflow.execution.requested` is now published to `flowpilot.commands` and routed to `flowpilot.execution-worker.workflow-executions`.
- `workflow.created` is now published to `flowpilot.events` and routed to workflow/observability event queues.
- Added workflow execution read APIs:
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions`
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId`
- Added the first `apps/execution-worker` consumer for `workflow.execution.requested`.
- The execution worker now updates executions from `PENDING` to `RUNNING` to `SUCCEEDED`.
- The execution worker publishes `workflow.execution.started` and `workflow.execution.completed` to `flowpilot.events`.
- Docker Compose now includes the `execution-worker` service.
- Hardened the execution worker with idempotent terminal-state skips for `SUCCEEDED`, `FAILED`, and `CANCELLED` executions.
- Added execution-worker retry scheduling through `flowpilot.retry` with 10s, 1m, and 5m retry queues that return to `flowpilot.commands`.
- Added execution-worker terminal failure handling that marks executions `FAILED`, persists the error payload, publishes `workflow.execution.failed`, and publishes the failed command to `flowpilot.dlx`.
- Added explicit retry routing key constants to `packages/contracts`.
- Added `OutboxMessage` persistence and migration for durable event publication tracking.
- Execution-worker lifecycle events are now written to the outbox before RabbitMQ publication and marked `PUBLISHED` after broker publish.
- Execution-worker terminal idempotency now attempts to dispatch any pending lifecycle outbox messages for the execution before acknowledging duplicate deliveries.
- Added a local-only worker failure simulation switch guarded by `FLOWPILOT_ENABLE_WORKER_FAILURE_SIMULATION=true` for validating retry/DLQ behavior without breaking infrastructure.
- Added an execution-worker outbox dispatcher loop that scans `OutboxMessage` rows with `PENDING` status every 5 seconds, publishes them to RabbitMQ, and marks them `PUBLISHED`.
- Outbox publish failures now increment `attempts`, store `lastError`, and mark the row `FAILED` after 5 failed attempts.

## In Progress

- Workflow execution event persistence in workflow-service or observability-service

## Not Started

- Frontend application UI
- LangChain integration
- RAG document ingestion
- Observability persistence and trace UI
- CI

## Verification

- `node -e` JSON manifest parse check passed.
- `docker compose config --quiet` passed.
- `pnpm -r typecheck` passed.
- `pnpm -r build` passed.
- `DATABASE_URL=postgresql://flowpilot:flowpilot@localhost:5432/flowpilot pnpm --filter @flowpilot/api prisma:validate` passed.
- `docker compose up -d` was attempted, but Docker daemon was not running locally.
- After adding the API service to Compose, `docker compose config --quiet` passed again.
- `pnpm -r typecheck` passed after adding `amqp-connection-manager`.
- `pnpm -r typecheck` passed after adding `class-validator` and `class-transformer`.
- `pnpm -r typecheck` and `pnpm --filter @flowpilot/api build` passed after adding `@fastify/static`.
- `docker compose up -d --force-recreate api` started the API successfully.
- `docker compose exec -T api wget -qO- http://127.0.0.1:3000/api/health` returned `status: ok`.
- `DATABASE_URL=postgresql://flowpilot:flowpilot@localhost:5432/flowpilot pnpm --filter @flowpilot/api exec prisma migrate dev --schema prisma/schema.prisma --name initial_workspace_rbac` applied the initial migration.
- `pnpm -r typecheck` passed after adding `WorkspacesModule`.
- `pnpm --filter @flowpilot/api build` passed after adding `WorkspacesModule`.
- `docker compose exec -T api wget -qO- --header='Content-Type: application/json' --post-data='{"name":"Acme Automation","slug":"acme-automation","ownerEmail":"owner@acme.test","ownerDisplayName":"Acme Owner"}' http://127.0.0.1:3000/api/workspaces` returned a persisted workspace with an `OWNER` membership.
- `docker compose exec -T api wget -qO- http://127.0.0.1:3000/api/workspaces` returned the persisted workspace list.
- `docker compose exec -T api wget -qO- http://127.0.0.1:3000/api/workspaces/:id` returned workspace details.
- `pnpm --filter @flowpilot/api test` passed with 4 tests.
- `pnpm --filter @flowpilot/api typecheck` passed after adding tests.
- `pnpm --filter @flowpilot/api build` passed after adding tests.
- `pnpm -r typecheck` passed after adding tests.
- `pnpm --filter @flowpilot/api test` passed with 8 tests after adding auth tests.
- `pnpm --filter @flowpilot/api typecheck` passed after adding auth.
- `pnpm --filter @flowpilot/api build` passed after adding auth.
- `pnpm -r typecheck` passed after adding auth.
- `DATABASE_URL=postgresql://flowpilot:flowpilot@localhost:5432/flowpilot pnpm --filter @flowpilot/api prisma:validate` passed after adding `passwordHash`.
- `docker compose up -d --force-recreate api` started the API with auth routes.
- `docker compose exec -T api wget -qO- --header='Content-Type: application/json' --post-data='{"email":"owner@acme.test","displayName":"Acme Owner","password":"correct horse battery staple"}' http://127.0.0.1:3000/api/auth/register` returned the registered user without `passwordHash`.
- `docker compose exec -T api wget -qO- --header='Content-Type: application/json' --post-data='{"email":"owner@acme.test","password":"correct horse battery staple","workspaceId":"5197de4a-7a9a-4795-b455-e4ab877aba9b"}' http://127.0.0.1:3000/api/auth/login` returned an access token with `OWNER` workspace context.
- `pnpm --filter @flowpilot/api test` passed with 14 tests after adding auth/RBAC guards.
- `pnpm --filter @flowpilot/api typecheck` passed after adding auth/RBAC guards.
- `pnpm --filter @flowpilot/api build` passed after adding auth/RBAC guards.
- `pnpm -r typecheck` passed after adding auth/RBAC guards.
- Manual HTTP checks against Docker returned `200` for `/api/auth/login`, `/api/auth/me`, `/api/workspaces`, and `/api/workspaces/:id` with a bearer token.
- `pnpm --filter @flowpilot/api test` passed with 21 tests after adding membership management.
- `pnpm --filter @flowpilot/api typecheck` passed after adding membership management.
- `pnpm --filter @flowpilot/api build` passed after adding membership management.
- `pnpm -r typecheck` passed after adding membership management.
- `docker compose config --quiet` passed after adding membership management.
- Manual HTTP checks against Docker returned `200/201` for login, member listing, member creation, role update, and member removal with a bearer token.
- `pnpm --filter @flowpilot/api test` passed with 21 tests after adding response DTO contracts.
- `pnpm --filter @flowpilot/api typecheck` passed after adding response DTO contracts.
- `pnpm --filter @flowpilot/api seed:demo` created or updated the local demo workspace and users for `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- `pnpm --filter @flowpilot/api test:integration` created `flowpilot_test`, applied Prisma migrations, and passed with 2 HTTP integration tests.
- `pnpm --filter @flowpilot/contracts test` passed with 5 messaging contract tests.
- `pnpm --filter @flowpilot/contracts typecheck` passed after adding messaging constants and envelope types.
- `pnpm --filter @flowpilot/contracts build` passed after adding messaging constants and envelope types.
- `pnpm -r typecheck` passed after formalizing messaging contracts.
- `pnpm --filter @flowpilot/api test` passed with 25 tests after adding workflow service coverage.
- `pnpm --filter @flowpilot/api typecheck` passed after adding workflow models and module.
- `pnpm --filter @flowpilot/api test:integration` applied the workflow migration to `flowpilot_test` and passed with 3 HTTP integration tests.
- `pnpm --filter @flowpilot/api build` passed after adding workflow models and module.
- `pnpm -r typecheck` passed after adding workflow models and module.
- Local development DB migration history was repaired with `prisma migrate resolve --applied 20260428012500_add_user_password_hash`, then `prisma migrate deploy` applied the workflow migration.
- `pnpm --filter @flowpilot/api seed:demo` created or updated the demo `Lead Enrichment` workflow.
- `pnpm --filter @flowpilot/contracts test` passed after adding `workflow.created`.
- `pnpm --filter @flowpilot/api test` passed after adding `workflow.created` publishing.
- `pnpm --filter @flowpilot/api test:integration` passed after adding `workflow.created` publishing.
- `pnpm --filter @flowpilot/api prisma:generate` passed after adding workflow executions.
- `pnpm --filter @flowpilot/api test` passed with 27 tests after adding workflow execution request service coverage.
- `pnpm --filter @flowpilot/api typecheck` passed after adding workflow execution request APIs.
- `pnpm --filter @flowpilot/api test:integration` applied the workflow execution migration to `flowpilot_test` and passed with 3 HTTP integration tests.
- `pnpm --filter @flowpilot/api typecheck` passed after adding the RabbitMQ declaration helper.
- `pnpm --filter @flowpilot/api test` passed with 31 tests after adding messaging topology coverage.
- `pnpm --filter @flowpilot/api test:integration` passed after replacing the publisher.
- `docker compose up -d --force-recreate api` started the API and logged `RabbitMQ topology declared`.
- `rabbitmqctl list_exchanges`, `list_queues`, and `list_bindings` confirmed the declared exchanges, queues, and bindings.
- Manual HTTP execution request created `WorkflowExecution` `8b0e06b9-3d91-4b39-a95b-0ec7332f9dda` and RabbitMQ showed the message in `flowpilot.execution-worker.workflow-executions` with `exchange=flowpilot.commands` and `routing_key=workflow.execution.requested`.
- `pnpm --filter @flowpilot/api test` passed with 35 tests after adding workflow execution read service coverage.
- `pnpm --filter @flowpilot/api typecheck` passed after adding workflow execution read APIs.
- `pnpm --filter @flowpilot/api test:integration` passed after adding workflow execution read HTTP coverage.
- Manual HTTP checks returned `200` for workflow execution list/detail and `404` for a missing execution id.
- `docker compose config --quiet` passed after adding the `execution-worker` service.
- `pnpm --filter @flowpilot/execution-worker typecheck`, `test`, and `build` passed after adding the consumer.
- `pnpm -r typecheck` passed after adding the consumer.
- `docker compose up -d api execution-worker` started the worker.
- Manual end-to-end test created execution `c93d91bd-77a8-457e-9d64-4a0e07ea34a0`; the worker consumed the command, updated the execution to `SUCCEEDED`, and RabbitMQ showed `workflow.execution.started` and `workflow.execution.completed` events in `flowpilot.workflow-service.execution-events`.
- `pnpm --filter @flowpilot/execution-worker typecheck` passed after adding idempotency, retry, DLX, and failed-event handling.
- `pnpm --filter @flowpilot/execution-worker test` passed with 7 tests after adding worker hardening coverage.
- `docker compose up -d --force-recreate execution-worker` started the hardened worker successfully.
- `rabbitmqctl list_queues` confirmed the execution-worker queue has 1 consumer and the 10s/1m/5m retry queues plus execution-worker DLQ exist with the expected TTL/dead-letter arguments.
- `pnpm --filter @flowpilot/api prisma:generate` passed after adding `OutboxMessage`.
- `pnpm --filter @flowpilot/execution-worker typecheck` and `test` passed after adding worker outbox publishing.
- `DATABASE_URL=postgresql://flowpilot:flowpilot@localhost:5432/flowpilot pnpm --filter @flowpilot/api exec prisma migrate deploy --schema prisma/schema.prisma` applied the outbox migration locally after granting Prisma access to local cache/preferences.
- `pnpm --filter @flowpilot/api test:integration` applied the outbox migration to `flowpilot_test` and passed.
- Manual end-to-end test created execution `daf41812-c87a-4d63-82fd-6608a7b51c4b`; the worker completed it and `OutboxMessage` rows for `workflow.execution.started` and `workflow.execution.completed` were marked `PUBLISHED` with one publish attempt each.
- Manual RabbitMQ failure-path validation created execution `f1aeb9cf-a5e8-4cb2-ad99-31473f01bdd0` with worker failure simulation enabled.
- The failed execution moved through retry scheduling at 10s, 1m, and 5m, then reached `FAILED` after the final attempt.
- RabbitMQ showed the command in `flowpilot.dlq.execution-worker.workflow-executions` with `x-flowpilot-retry-attempt=3` and dead-letter error headers.
- RabbitMQ `flowpilot.workflow-service.execution-events` contained both `workflow.execution.started` and `workflow.execution.failed` for the failed execution.
- PostgreSQL `OutboxMessage` rows for `workflow.execution.started` and `workflow.execution.failed` were marked `PUBLISHED`.
- The execution worker was recreated afterward with `FLOWPILOT_ENABLE_WORKER_FAILURE_SIMULATION=false`.
- `pnpm --filter @flowpilot/execution-worker test` passed with 10 tests after adding outbox dispatcher coverage.
- `pnpm --filter @flowpilot/execution-worker typecheck` passed after adding the outbox dispatcher loop.
- Manual outbox dispatcher validation inserted `OutboxMessage` `manual-outbox-dispatch-1` with `PENDING` status; the worker dispatcher published it to RabbitMQ, marked it `PUBLISHED`, and `flowpilot.workflow-service.execution-events` received the `workflow.execution.started` message.

## Notes

- Existing uncommitted change to this file marked GitHub publication as completed and monorepo scaffold as in progress before this session started. That change was preserved and expanded.
- Prisma was pinned to version 6 because Prisma 7 requires the newer datasource/client configuration flow, which is unnecessary friction at this stage.
- `pnpm-lock.yaml` is now generated and should be committed with the backend dependency changes.
- `@prisma/client/index` is used for generated Prisma imports under the current NodeNext setup because the default export path did not expose regenerated schema types reliably.
- The local database had inconsistent Prisma migration metadata during auth migration testing. The `passwordHash` column was applied locally with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; the migration file is still present for clean environments.

## Recommended Next Step

Start persisting workflow execution events in a workflow-service or observability-service slice so `workflow.execution.started`, `workflow.execution.completed`, and `workflow.execution.failed` become queryable as an execution timeline.

## Notes For Next Chat

Start by reading:

- `README.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/DECISIONS.md`
- `docs/NEXT_STEPS.md`

Then start persisting workflow execution events in a workflow-service or observability-service slice.
