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
- Added the first workflow domain model with `Workflow`, `WorkflowVersion`, and `WorkflowStatus`.
- Added workspace-scoped workflow create/list/detail APIs with RBAC.
- Updated the demo seed with a `Lead Enrichment` workflow.
- Added `workflow.created` message contract.
- Added `MessagingService.publishEvent(...)` and publish `workflow.created` after workflow creation.
- Added `WorkflowExecution` persistence with `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, and `CANCELLED` statuses.
- Added `POST /api/workspaces/:workspaceId/workflows/:workflowId/executions` to create a pending execution and publish `workflow.execution.requested`.
- Added validation, response DTOs, unit tests, and HTTP integration coverage for workflow execution requests.
- Added an `amqplib`-backed RabbitMQ declaration/publisher helper in the API.
- Declared `flowpilot.commands`, `flowpilot.events`, `flowpilot.retry`, `flowpilot.dlx`, service queues, and initial bindings at API startup.
- Verified `workflow.execution.requested` reaches `flowpilot.execution-worker.workflow-executions` through `flowpilot.commands`.
- Added workflow execution list/detail APIs:
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions`
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId`
- Added unit and integration coverage for workflow execution reads.
- Added the first `apps/execution-worker` consumer for `workflow.execution.requested`.
- Added Docker Compose service wiring for `execution-worker`.
- Verified the end-to-end flow: API publishes command, worker consumes it, PostgreSQL execution becomes `SUCCEEDED`, and RabbitMQ receives `workflow.execution.started` plus `workflow.execution.completed`.

## Immediate Tasks

- Harden execution-worker idempotency and retry behavior.
- Add `workflow.execution.failed` publishing for worker errors.
- Add outbox-backed publishing after worker retry/failure semantics are explicit.
- Add explicit ownership-transfer policy only when product requirements need it.

## Next Architecture Tasks

- Define role permissions for `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- Add local service Dockerfiles after the first service process is real.

## Open Questions

- Should `apps/api` own all auth/workspace data for the MVP, or should workspace APIs move into a separate service after auth stabilizes?
- Should RabbitMQ declarations stay in service startup code long-term, or move to infrastructure-as-code once deployment shape is clearer?
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

Estado atual: o monorepo TypeScript/pnpm já foi scaffoldado com apps, packages, Docker Compose, `.env.example`, contratos iniciais de eventos RabbitMQ e documentação atualizada. `apps/api` usa NestJS com Fastify, Zod/dotenv para config, Prisma 6, Swagger em `/docs`, healthcheck em `/api/health`, RabbitMQ via um publisher/declaration helper com `amqplib`, workspace APIs persistidas e auth register/login/me com JWT. O schema Prisma tem `Workspace`, `User`, `WorkspaceMember`, `WorkspaceRole`, `User.passwordHash`, `Workflow`, `WorkflowVersion`, `WorkflowStatus`, `WorkflowExecution` e `WorkflowExecutionStatus`. Workspace routes exigem bearer token; listagem é filtrada por membership; detalhe exige role de workspace; criação usa o usuário autenticado como `OWNER`. Há `JwtAuthGuard`, `@CurrentUser()`, `@WorkspaceRoles(...)` e `WorkspaceRolesGuard`. Também existem endpoints de membership para listar, adicionar, alterar role e remover membros. A política atual é conservadora: member management não atribui/remove/altera `OWNER`, e `ADMIN` só gerencia `MEMBER`/`VIEWER`. As respostas públicas de auth/workspace/member/workflow/workflow execution têm DTOs explícitos ligados ao Swagger. Existe `pnpm --filter @flowpilot/api seed:demo` para criar dados locais repetíveis com users `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` e um workflow `Lead Enrichment`. Existe `pnpm --filter @flowpilot/api test:integration`, que cria/usa `flowpilot_test`, aplica migrations e testa fluxos HTTP reais com banco. As convenções RabbitMQ estão documentadas em `docs/contracts/events.md`, incluindo exchanges, queues, routing keys, retry/DLX, envelope, correlation/causation e idempotency. `packages/contracts` exporta constants/helpers e envelope/message types para essas convenções, incluindo `workflow.created` e `workflow.execution.requested`. A API declara `flowpilot.commands`, `flowpilot.events`, `flowpilot.retry`, `flowpilot.dlx`, service queues e bindings no startup; publica `workflow.created` em `flowpilot.events`; cria `WorkflowExecution` `PENDING` antes de publicar `workflow.execution.requested` em `flowpilot.commands`, roteando para `flowpilot.execution-worker.workflow-executions`; e expõe list/detail de workflow executions por workflow. `apps/execution-worker` consome `workflow.execution.requested`, atualiza a execução para `RUNNING`, depois `SUCCEEDED`, e publica `workflow.execution.started` e `workflow.execution.completed` em `flowpilot.events`. O Docker Compose sobe `api` e `execution-worker`, buildando `@flowpilot/contracts` e gerando Prisma Client antes dos processos. `pnpm --filter @flowpilot/contracts test`, `pnpm --filter @flowpilot/contracts typecheck`, `pnpm --filter @flowpilot/api test`, `pnpm --filter @flowpilot/api test:integration`, `pnpm --filter @flowpilot/execution-worker test`, `pnpm --filter @flowpilot/execution-worker typecheck` e `pnpm -r typecheck` passaram.

Depois disso, me ajude a continuar a Semana 1. Quero que você atue como tech lead/coding partner: primeiro rode `git status`, revise o estado atual, suba a stack com `docker compose up -d`, rode `pnpm --filter @flowpilot/api seed:demo`, `pnpm --filter @flowpilot/api test`, `pnpm --filter @flowpilot/api test:integration`, `pnpm --filter @flowpilot/execution-worker test`, `pnpm --filter @flowpilot/execution-worker typecheck`, `pnpm --filter @flowpilot/contracts test` e `pnpm -r typecheck`, e então endureça o execution-worker com idempotência, retry/failure semantics e publicação de `workflow.execution.failed`. Atualize `docs/STATUS.md`, `docs/DECISIONS.md` e `docs/NEXT_STEPS.md` ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```
