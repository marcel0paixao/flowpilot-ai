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

## Immediate Tasks

- Install dependencies with `pnpm install`.
- Run `pnpm check` and fix any TypeScript issues.
- Add a minimal HTTP server for `apps/api`.
- Add `/health` endpoint and structured request logging.
- Add first unit test or Node test for shared config/logger behavior.
- Decide whether to add a lightweight HTTP framework now, such as Fastify, or keep the first service on Node's built-in HTTP server until requirements are clearer.

## Next Architecture Tasks

- Add database schema and migration tooling decision.
- Define user, workspace, role, and permission models.
- Define RabbitMQ exchange/queue naming conventions.
- Add local service Dockerfiles after the first service process is real.

## Open Questions

- Should the backend use Fastify from the start for ergonomics, or stay dependency-light for one more step?
- Should persistence start with Prisma, Drizzle, or plain SQL migrations?
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

Estado atual: o monorepo TypeScript/pnpm já foi scaffoldado com apps, packages, Docker Compose, `.env.example`, contratos iniciais de eventos RabbitMQ e documentação atualizada. O ambiente anterior não tinha `pnpm`, `npm` ou `tsc` no PATH, então ainda falta rodar `pnpm install` e `pnpm check`.

Depois disso, me ajude a continuar a Semana 1. Quero que você atue como tech lead/coding partner: primeiro rode `git status`, revise o estado atual, instale/verifique dependências se possível, implemente o primeiro backend slice pequeno (`apps/api` com `/health`, config e logging), e atualize `docs/STATUS.md`, `docs/DECISIONS.md` e `docs/NEXT_STEPS.md` ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```
