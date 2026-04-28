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

## Immediate Tasks

- Add a request/response contract shape for workspace responses so user data exposure stays intentional.
- Add auth registration/login endpoints.
- Add JWT issuance with workspace role claims.
- Add password hashing dependency and user credential storage strategy.
- Add auth tests for register/login and invalid credentials.

## Next Architecture Tasks

- Define role permissions for `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER`.
- Add Nest guards/decorators for workspace-scoped authorization.
- Define RabbitMQ exchange/queue naming conventions.
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

Estado atual: o monorepo TypeScript/pnpm já foi scaffoldado com apps, packages, Docker Compose, `.env.example`, contratos iniciais de eventos RabbitMQ e documentação atualizada. `apps/api` usa NestJS com Fastify, Zod/dotenv para config, Prisma 6, Swagger em `/docs`, healthcheck em `/api/health`, RabbitMQ via `@nestjs/microservices`, workspace APIs persistidas e testes automatizados iniciais. O schema Prisma tem `Workspace`, `User`, `WorkspaceMember` e `WorkspaceRole` como base RBAC. O Docker Compose sobe o serviço `api`. `pnpm --filter @flowpilot/api test`, `pnpm -r typecheck`, `pnpm --filter @flowpilot/api build`, Prisma migration e testes manuais via `docker compose exec` passaram.

Depois disso, me ajude a continuar a Semana 1. Quero que você atue como tech lead/coding partner: primeiro rode `git status`, revise o estado atual, suba a stack com `docker compose up -d`, verifique `/api/health`, `/docs` e `/api/workspaces`, e implemente o próximo slice de auth/JWT com roles por workspace. Atualize `docs/STATUS.md`, `docs/DECISIONS.md` e `docs/NEXT_STEPS.md` ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```
