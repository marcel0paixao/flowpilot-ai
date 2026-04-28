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

## In Progress

- Week 1 backend foundation hardening and first tenant APIs.

## Not Started

- Authentication HTTP APIs
- RabbitMQ publishers, consumers, exchanges, and queue conventions
- Workflow definition model
- JWT authentication and RBAC guards
- Frontend application UI
- LangChain integration
- RAG document ingestion
- Observability persistence and trace UI
- Tests and CI

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

## Notes

- Existing uncommitted change to this file marked GitHub publication as completed and monorepo scaffold as in progress before this session started. That change was preserved and expanded.
- Prisma was pinned to version 6 because Prisma 7 requires the newer datasource/client configuration flow, which is unnecessary friction at this stage.
- `pnpm-lock.yaml` is now generated and should be committed with the backend dependency changes.
- `@prisma/client/index` is used for generated Prisma imports under the current NodeNext setup because the default export path did not expose regenerated schema types reliably.

## Recommended Next Step

Add automated tests for health and workspaces, then implement auth registration/login with JWT and workspace-scoped role claims.

## Notes For Next Chat

Start by reading:

- `README.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/DECISIONS.md`
- `docs/NEXT_STEPS.md`

Then continue with tests and the first auth/JWT implementation.
