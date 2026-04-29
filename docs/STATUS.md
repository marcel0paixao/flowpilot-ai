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

## In Progress

- Week 1 backend foundation hardening.

## Not Started

- RabbitMQ publishers, consumers, exchanges, and queue conventions
- Workflow definition model
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

## Notes

- Existing uncommitted change to this file marked GitHub publication as completed and monorepo scaffold as in progress before this session started. That change was preserved and expanded.
- Prisma was pinned to version 6 because Prisma 7 requires the newer datasource/client configuration flow, which is unnecessary friction at this stage.
- `pnpm-lock.yaml` is now generated and should be committed with the backend dependency changes.
- `@prisma/client/index` is used for generated Prisma imports under the current NodeNext setup because the default export path did not expose regenerated schema types reliably.
- The local database had inconsistent Prisma migration metadata during auth migration testing. The `passwordHash` column was applied locally with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; the migration file is still present for clean environments.

## Recommended Next Step

Add seed/demo scripts for repeatable local testing, then add integration tests against a real test database.

## Notes For Next Chat

Start by reading:

- `README.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/DECISIONS.md`
- `docs/NEXT_STEPS.md`

Then continue with seed/demo scripts, integration tests, and RabbitMQ publishing conventions.
