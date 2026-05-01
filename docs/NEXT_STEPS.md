# Next Steps

## Week 1 Target

Create the project foundation.

## Completed This Session

- Chose TypeScript-first pnpm workspace.
- Defined service folder structure under `apps/*`.
- Added shared packages under `packages/*`.
- Added Docker Compose for PostgreSQL, RabbitMQ, Redis, and Qdrant.
- Added `.env.example`.
- Added initial RabbitMQ event contracts in `packages/contracts`.
- Added event contract notes in `docs/contracts/events.md`.
- Added basic monorepo scripts in root `package.json`.
- Installed backend dependencies for `apps/api`.
- Converted `apps/api` to NestJS with the Fastify adapter.
- Added Zod/dotenv runtime config validation.
- Added `/api/health` and Swagger setup at `/docs`.
- Added Prisma 6 with initial `Workspace` and `User` models.
- Added a RabbitMQ client module using `@nestjs/microservices`.
- Fixed shared package exports so monorepo typechecking works before package builds.
- Added the API service to Docker Compose.
- Added `amqp-connection-manager` to satisfy NestJS `ClientRMQ` runtime requirements.
- Added `class-validator` and `class-transformer` to satisfy NestJS `ValidationPipe` runtime requirements.
- Added `@fastify/static` to satisfy Swagger static asset runtime requirements on Fastify.
- Added initial Prisma migration for workspace RBAC foundations.
- Added `WorkspacesModule` with `POST /api/workspaces`, `GET /api/workspaces`, and `GET /api/workspaces/:id`.
- Added `WorkspaceMember` and `WorkspaceRole` as the RBAC foundation.
- Added automated API tests for health and workspace service behavior.
- Added `AuthModule` with register/login endpoints.
- Added password hashing with `bcryptjs`.
- Added JWT access tokens with optional workspace role claims.
- Added auth unit tests.
- Added JWT auth guard, current-user decorator, workspace roles decorator, and workspace role guard.
- Added `GET /api/auth/me`.
- Protected workspace routes with JWT and workspace membership checks.
- Changed workspace creation to use the authenticated user as `OWNER`.
- Scoped workspace listing to the authenticated user's memberships.
- Added safe user selection to avoid exposing `passwordHash` in workspace responses.
- Added unit tests for auth/RBAC guards and membership filtering.
- Added workspace membership endpoints:
  - `GET /api/workspaces/:id/members`
  - `POST /api/workspaces/:id/members`
  - `PATCH /api/workspaces/:id/members/:memberId`
  - `DELETE /api/workspaces/:id/members/:memberId`
- Added conservative role policy for membership management.
- Added unit tests for workspace membership permissions.
- Added explicit response DTO contracts for auth, workspace, and workspace member responses.
- Wired Swagger response metadata to those response DTOs.
- Added `pnpm --filter @flowpilot/api seed:demo` for repeatable local demo data.
- Added `pnpm --filter @flowpilot/api test:integration` for HTTP integration tests with a real PostgreSQL test database.
- Defined RabbitMQ exchange, queue, routing key, retry, dead-letter, envelope, correlation, causation, and idempotency conventions in `docs/contracts/events.md`.
- Added RabbitMQ constants/helpers, derived messaging types, and enveloped message types in `packages/contracts`.
- Added contracts tests for routing key alignment and messaging naming conventions.

## Immediate Tasks

- Add first workflow domain model and persistence shape in Prisma/API.
- Add explicit ownership-transfer policy only when product requirements need it.

## Next Architecture Tasks

- Define role permissions for `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- Decide whether the API service should connect to RabbitMQ at startup or lazily when publishing first messages.
- Add local service Dockerfiles after the first service process is real.

## Open Questions

- Should `apps/api` own all auth/workspace data for the MVP, or should workspace APIs move into a separate service after auth stabilizes?
- Should RabbitMQ queue/exchange declarations live in code, migration-like setup scripts, or local infrastructure scripts?
- Should the web app be initialized as Next.js immediately, or after backend APIs exist?

## Prompt For Next Chat

```txt
Estou construindo o projeto autoral flowpilot-ai, uma plataforma SaaS multi-tenant de workflow automation com microservices, RabbitMQ, Redis, LangChain, RAG e observabilidade de LLM.

Este novo chat deve continuar o projeto sem depender de conversas anteriores. Leia primeiro:

- README.md
- docs/ROADMAP.md
- docs/ARCHITECTURE.md
- docs/STATUS.md
- docs/DECISIONS.md
- docs/NEXT_STEPS.md

Estado atual: o monorepo TypeScript/pnpm já foi scaffoldado com apps, packages, Docker Compose, `.env.example`, contratos iniciais de eventos RabbitMQ e documentação atualizada. `apps/api` usa NestJS com Fastify, Zod/dotenv para config, Prisma 6, Swagger em `/docs`, healthcheck em `/api/health`, RabbitMQ via `@nestjs/microservices`, workspace APIs persistidas e auth register/login/me com JWT. O schema Prisma tem `Workspace`, `User`, `WorkspaceMember`, `WorkspaceRole` e `User.passwordHash`. Workspace routes exigem bearer token; listagem é filtrada por membership; detalhe exige role de workspace; criação usa o usuário autenticado como `OWNER`. Há `JwtAuthGuard`, `@CurrentUser()`, `@WorkspaceRoles(...)` e `WorkspaceRolesGuard`. Também existem endpoints de membership para listar, adicionar, alterar role e remover membros. A política atual é conservadora: member management não atribui/remove/altera `OWNER`, e `ADMIN` só gerencia `MEMBER`/`VIEWER`. As respostas públicas de auth/workspace/member têm DTOs explícitos ligados ao Swagger. Existe `pnpm --filter @flowpilot/api seed:demo` para criar dados locais repetíveis com users `OWNER`, `ADMIN`, `MEMBER` e `VIEWER`. Existe `pnpm --filter @flowpilot/api test:integration`, que cria/usa `flowpilot_test`, aplica migrations e testa fluxos HTTP reais com banco. As convenções RabbitMQ estão documentadas em `docs/contracts/events.md`, incluindo exchanges, queues, routing keys, retry/DLX, envelope, correlation/causation e idempotency. `packages/contracts` exporta constants/helpers e envelope/message types para essas convenções. O Docker Compose sobe o serviço `api`. `pnpm --filter @flowpilot/contracts test`, `pnpm --filter @flowpilot/contracts typecheck`, `pnpm --filter @flowpilot/api test` e `pnpm -r typecheck` passaram.

Depois disso, me ajude a continuar a Semana 1. Quero que você atue como tech lead/coding partner: primeiro rode `git status`, revise o estado atual, suba a stack com `docker compose up -d`, rode `pnpm --filter @flowpilot/api seed:demo`, `pnpm --filter @flowpilot/api test`, `pnpm --filter @flowpilot/api test:integration`, `pnpm --filter @flowpilot/contracts test` e `pnpm -r typecheck`, e então implemente o primeiro workflow domain model. Atualize `docs/STATUS.md`, `docs/DECISIONS.md` e `docs/NEXT_STEPS.md` ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```
