# Next Steps

## Week 1 Target

Create the project foundation.

## Tasks

- Choose monorepo tooling.
- Define service folder structure.
- Add Docker Compose for PostgreSQL, RabbitMQ, Redis, and vector store.
- Add environment variable examples.
- Create initial architecture diagram.
- Define first RabbitMQ event contracts.
- Add basic development commands.

## Recommended First Implementation Choice

Use a TypeScript-first monorepo:

- `apps/web`
- `apps/api`
- `apps/workflow-service`
- `apps/execution-worker`
- `apps/ai-orchestrator`
- `apps/observability-service`
- `packages/contracts`
- `packages/config`
- `packages/logger`

Python can still be introduced later for AI-specific experimentation, but starting TypeScript-first reduces setup overhead.

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

Depois disso, me ajude com a Semana 1 do cronograma. Quero que você atue como tech lead/coding partner: revise o estado atual, proponha o plano da semana, implemente comigo passo a passo e atualize a documentação ao final.

Importante: este é um projeto autoral de portfólio. Não copie código, nomes internos ou detalhes proprietários de empresas anteriores.
```

