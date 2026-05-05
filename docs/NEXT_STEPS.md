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
- Hardened the execution worker with idempotent terminal-state skips, retry queue scheduling, terminal `FAILED` persistence, `workflow.execution.failed` publishing, and DLQ publication for exhausted commands.
- Added explicit retry routing key constants and tests covering retry header parsing, retry scheduling, terminal idempotency, and failed-event/DLQ behavior.
- Added `OutboxMessage` persistence and migration.
- Changed execution-worker lifecycle publication to persist outbox rows before RabbitMQ publish and mark rows `PUBLISHED` after broker dispatch.
- Added a local-only worker failure simulation switch guarded by `FLOWPILOT_ENABLE_WORKER_FAILURE_SIMULATION=true`.
- Validated the real RabbitMQ failure path with execution `f1aeb9cf-a5e8-4cb2-ad99-31473f01bdd0`: retry 10s, retry 1m, retry 5m, terminal `FAILED`, `workflow.execution.failed`, and DLQ command with retry attempt 3.
- Added a periodic execution-worker outbox dispatcher loop for `OutboxMessage PENDING` recovery.
- Validated the dispatcher manually with `manual-outbox-dispatch-1`: the worker published the pending event to RabbitMQ and marked the row `PUBLISHED`.
- Added `WorkflowExecutionEvent` persistence and migration.
- Added `workflow-service` as a RabbitMQ consumer for `workflow.execution.*` events.
- Validated timeline persistence manually with execution `89d5c509-775d-41ab-b111-8bd3d2019ba9`, which stored `workflow.execution.started` and `workflow.execution.completed`.
- Added API read endpoint for persisted execution timeline events:
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/events`
- Added explicit workflow execution event response DTOs and Swagger metadata.
- Added unit and HTTP integration tests for execution timeline reads and missing-execution `404` behavior.
- Validated the real API/worker/workflow-service path manually with execution `a367abaa-b8be-4213-8ab1-e63206ff583d`: the execution reached `SUCCEEDED`, and the timeline endpoint returned `workflow.execution.started` plus `workflow.execution.completed`.
- Added a shared `WorkflowDefinition` contract in `packages/contracts`.
- Added MVP node types:
  - `trigger.manual`
  - `action.transform`
  - `action.httpRequest`
- Added validation for unique node/edge IDs, valid edge references, at least one manual trigger, no incoming edges to manual triggers, reachability from a trigger, and acyclic graphs.
- API workflow creation now validates `definition` through the shared contract instead of accepting arbitrary JSON.
- New workflow creation without an explicit definition now defaults to a valid manual trigger definition.
- Updated the demo seed so `Lead Enrichment` has real nodes and edges: `manual-trigger -> normalize-lead -> enrichment-request`.
- Aligned future node lifecycle routing keys to `workflow.node.execution.started`, `workflow.node.execution.completed`, and `workflow.node.execution.failed`.
- Validated manually that the demo workflow detail returns the new nodes/edges and that a broken edge definition returns `400`.
- Added `WorkflowNodeExecution` persistence and migration.
- Added `WorkflowNodeExecutionStatus` with `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, and `SKIPPED`.
- Added persisted node execution identity to `workflow.node.execution.*` payload contracts.
- Added API read endpoint for node progress:
  - `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/nodes`
- Added explicit workflow node execution response DTOs and Swagger metadata.
- Added unit and HTTP integration tests for node progress reads and missing-execution `404` behavior.
- Validated manually that the node progress endpoint returns persisted node execution rows for execution `4405a458-f050-49fc-aaec-0e4bc416f26d`.

## Immediate Tasks

- Have `execution-worker` load the current `WorkflowVersion.definition` for each execution request.
- Execute the validated workflow nodes sequentially for the MVP.
- Persist node status, input, output, error, `startedAt`, and `completedAt`.
- Emit `workflow.node.execution.started`, `workflow.node.execution.completed`, and `workflow.node.execution.failed` through the existing outbox path.
- Extend workflow-service timeline persistence to consume and store `workflow.node.execution.*` events.
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

Estado atual: o monorepo TypeScript/pnpm já foi scaffoldado com apps, packages, Docker Compose, `.env.example`, contratos iniciais de eventos RabbitMQ e documentação atualizada. `apps/api` usa NestJS com Fastify, Zod/dotenv para config, Prisma 6, Swagger em `/docs`, healthcheck em `/api/health`, RabbitMQ via um publisher/declaration helper com `amqplib`, workspace APIs persistidas e auth register/login/me com JWT. O schema Prisma tem `Workspace`, `User`, `WorkspaceMember`, `WorkspaceRole`, `User.passwordHash`, `Workflow`, `WorkflowVersion`, `WorkflowStatus`, `WorkflowExecution`, `WorkflowExecutionStatus`, `WorkflowExecutionEvent`, `WorkflowNodeExecution`, `WorkflowNodeExecutionStatus`, `OutboxMessage` e `OutboxMessageStatus`. Workspace routes exigem bearer token; listagem é filtrada por membership; detalhe exige role de workspace; criação usa o usuário autenticado como `OWNER`. Há `JwtAuthGuard`, `@CurrentUser()`, `@WorkspaceRoles(...)` e `WorkspaceRolesGuard`. Também existem endpoints de membership para listar, adicionar, alterar role e remover membros. A política atual é conservadora: member management não atribui/remove/altera `OWNER`, e `ADMIN` só gerencia `MEMBER`/`VIEWER`. As respostas públicas de auth/workspace/member/workflow/workflow execution/workflow execution event/workflow node execution têm DTOs explícitos ligados ao Swagger. `packages/contracts` agora define o contrato `WorkflowDefinition` com Zod, os node types `trigger.manual`, `action.transform` e `action.httpRequest`, validação de IDs únicos, edges válidas, trigger manual obrigatório, reachability, no incoming edge em trigger e grafo acíclico. A API usa esse schema para validar `definition` em workflow creation e aplica uma definição padrão com `manual-trigger` quando `definition` não é enviada. Existe `pnpm --filter @flowpilot/api seed:demo` para criar dados locais repetíveis com users `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` e um workflow `Lead Enrichment` com nodes reais `manual-trigger -> normalize-lead -> enrichment-request`. Existe `pnpm --filter @flowpilot/api test:integration`, que cria/usa `flowpilot_test`, aplica migrations e testa fluxos HTTP reais com banco. As convenções RabbitMQ estão documentadas em `docs/contracts/events.md`, incluindo exchanges, queues, routing keys, retry/DLX, envelope, correlation/causation e idempotency. `packages/contracts` exporta constants/helpers e envelope/message types para essas convenções, incluindo `workflow.created`, `workflow.execution.requested`, retry routing keys explícitas e os futuros eventos `workflow.node.execution.started`, `workflow.node.execution.completed` e `workflow.node.execution.failed`; os payloads de node incluem `nodeExecutionId`, `nodeId`, `nodeType`, input/output/duration/error conforme o evento. A API declara `flowpilot.commands`, `flowpilot.events`, `flowpilot.retry`, `flowpilot.dlx`, service queues e bindings no startup; publica `workflow.created` em `flowpilot.events`; cria `WorkflowExecution` `PENDING` antes de publicar `workflow.execution.requested` em `flowpilot.commands`, roteando para `flowpilot.execution-worker.workflow-executions`; expõe list/detail de workflow executions por workflow; expõe timeline persistida por `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/events`; e expõe progresso por node em `GET /api/workspaces/:workspaceId/workflows/:workflowId/executions/:executionId/nodes`. `apps/execution-worker` consome `workflow.execution.requested`, atualiza a execução para `RUNNING`, depois `SUCCEEDED`, e publica `workflow.execution.started` e `workflow.execution.completed` em `flowpilot.events`. O worker também ignora execuções já terminais, agenda erros retryable em filas de retry 10s/1m/5m, marca falhas terminais como `FAILED`, publica `workflow.execution.failed` e envia cópia do comando para `flowpilot.dlx`. Lifecycle events do worker agora são persistidos em `OutboxMessage` antes do publish e marcados como `PUBLISHED` depois do dispatch para RabbitMQ. O worker também roda um dispatcher periódico para publicar `OutboxMessage PENDING` deixadas por crashes. `apps/workflow-service` consome `workflow.execution.*` da fila `flowpilot.workflow-service.execution-events` e persiste timeline em `WorkflowExecutionEvent` idempotentemente por `eventId`. Existe uma simulação local de falha protegida por `FLOWPILOT_ENABLE_WORKER_FAILURE_SIMULATION=true`, já usada para validar o caminho real 10s -> 1m -> 5m -> DLQ com status `FAILED` e evento `workflow.execution.failed`. O Docker Compose sobe `api`, `execution-worker` e `workflow-service`, buildando `@flowpilot/contracts` e gerando Prisma Client antes dos processos. `pnpm --filter @flowpilot/contracts test`, `pnpm --filter @flowpilot/contracts typecheck`, `pnpm --filter @flowpilot/api test`, `pnpm --filter @flowpilot/api test:integration`, `pnpm --filter @flowpilot/execution-worker test`, `pnpm --filter @flowpilot/execution-worker typecheck`, `pnpm --filter @flowpilot/workflow-service test`, `pnpm --filter @flowpilot/workflow-service typecheck` e `pnpm -r typecheck` passaram. O endpoint de timeline foi validado manualmente com execution `a367abaa-b8be-4213-8ab1-e63206ff583d`, retornando `workflow.execution.started` e `workflow.execution.completed`. A validação de workflow definition foi validada manualmente: o workflow demo retorna nodes/edges reais e uma edge quebrada retorna HTTP 400. O endpoint de node progress foi validado manualmente com execution `4405a458-f050-49fc-aaec-0e4bc416f26d`, retornando a node execution persistida `manual-node-api-check-1`.

Depois disso, me ajude a continuar a Semana 1. Quero que você atue como tech lead/coding partner: primeiro rode `git status`, revise o estado atual, suba a stack com `docker compose up -d`, rode `pnpm --filter @flowpilot/api seed:demo`, `pnpm --filter @flowpilot/contracts test`, `pnpm --filter @flowpilot/api test`, `pnpm --filter @flowpilot/api test:integration`, `pnpm --filter @flowpilot/execution-worker test`, `pnpm --filter @flowpilot/execution-worker typecheck`, `pnpm --filter @flowpilot/workflow-service test`, `pnpm --filter @flowpilot/workflow-service typecheck` e `pnpm -r typecheck`, e então implemente o runtime do execution-worker por node: carregar `WorkflowVersion.definition`, executar nodes validados sequencialmente, preencher `WorkflowNodeExecution`, emitir eventos `workflow.node.execution.*` via outbox e fazer o workflow-service persistir esses eventos na timeline. Atualize `docs/STATUS.md`, `docs/DECISIONS.md` e `docs/NEXT_STEPS.md` ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```
