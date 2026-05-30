# Brief De Apresentação Do Portfólio

## One-liner

FlowPilot AI é uma plataforma SaaS multi-tenant de automação de workflows com execução assíncrona, AI Orchestrator em Python, integração real com LLM via OpenRouter e observabilidade de execuções de IA.

## Pitch Curto

O projeto demonstra como construir um sistema real de workflow automation que combina engenharia de software, sistemas distribuídos e IA aplicada.

Em vez de tratar LLM como um chatbot isolado, o FlowPilot AI coloca IA dentro de uma execução de workflow: recebe input, transforma dados, avalia condições, busca contexto, chama um modelo e registra métricas operacionais como latência, tokens, status, provider e custo estimado.

## O Que Mostrar Primeiro

1. Tela do workflow builder com o fluxo `Demo - Real AI Incident Triage`.
2. Execução bem-sucedida com `6/6` nodes.
3. Aba de AI traces mostrando provider, modelo, tokens e status.
4. Detalhes do output gerado pelo modelo.
5. Código/documentação do AI Orchestrator e do contrato `action.aiPrompt`.

## Demo Principal

`Demo - Real AI Incident Triage`

Case:

Uma empresa SaaS recebe um incidente de alta severidade: automações de vendas estão atrasadas e leads de alto valor não chegam aos account executives antes de uma reunião de pipeline.

O workflow:

- Normaliza os dados do incidente.
- Avalia se a severidade é `high`.
- Enriquece o contexto com um HTTP node em modo mock.
- Usa OpenRouter via AI Orchestrator Python para gerar um plano de triagem.
- Persiste dados de observabilidade para análise posterior.

## Métricas Da Execução Real

| Métrica | Valor |
|---|---|
| Status | `SUCCEEDED` |
| Nodes | `6/6` |
| Events | `14` |
| Provider | `openrouter` |
| Model | `openai/gpt-oss-20b:free` |
| Total tokens | `843` |
| Provider latency | `27402 ms` |
| Execution duration | `29.1 s` |

## Competências Demonstradas

- Backend com NestJS, Fastify, Prisma e PostgreSQL.
- Autenticação JWT, RBAC e multi-tenancy.
- Execução assíncrona com RabbitMQ.
- Worker com retry, DLQ, idempotência e eventos de ciclo de vida.
- Frontend com React, Vite, TypeScript e React Flow.
- AI Orchestrator em Python com FastAPI e Pydantic.
- Provider abstraction para LLMs.
- Integração real com OpenRouter.
- Credenciais criptografadas e workspace-scoped.
- Observabilidade de IA com tokens, latência, status, provider, modelo e custo estimado.
- Base para analytics, benchmarks, EDA e comparação de modelos.

## Material Visual Pronto

- Workflow builder: `docs/assets/demo-workflow-builder.png`
- AI node config: `docs/assets/demo-ai-node-config.png`
- Execution summary: `docs/assets/demo-execution-summary.png`
- AI traces: `docs/assets/demo-ai-traces.png`
- Timeline modal: `docs/assets/demo-timeline-modal.png`
- Execution data/output: `docs/assets/demo-execution-data.png`
- Credentials: `docs/assets/demo-credentials.png`
- GIF curto: `docs/assets/flowpilot-linkedin-demo.gif`

## Post Inicial Para LinkedIn

Estou lançando o FlowPilot AI no meu portfólio.

É um SaaS de workflow automation com IA aplicada. A ideia é simples: se um workflow chama um modelo, essa chamada precisa ser executável, rastreável e mensurável.

No MVP já dá para montar um fluxo visual, rodar a execução via RabbitMQ, chamar um AI Orchestrator em Python/FastAPI e ver traces com provider, modelo, tokens, latência, status e custo estimado.

A demo principal é uma triagem de incidente:

Manual Trigger -> Transform -> Condition -> HTTP Request -> AI Prompt -> Final Output

O workflow recebe um incidente de alta severidade, normaliza os dados, adiciona contexto, chama um modelo via OpenRouter e registra o que aconteceu na execução.

Stack:

React, Vite, TypeScript, NestJS, Fastify, Prisma, PostgreSQL, RabbitMQ, Redis, Docker Compose, Python/FastAPI e OpenRouter.

O que eu quis demonstrar aqui:

- arquitetura multi-tenant;
- execução assíncrona com worker;
- retries, DLQ, idempotência e outbox;
- credenciais criptografadas por workspace;
- observabilidade de IA dentro de um fluxo real;
- CI com lint, typecheck, testes, build e validações Python.

Ainda quero evoluir para Ollama, RAG, benchmarks e EDA em cima dos traces.

Mas este já é um recorte funcional do tipo de engenharia que eu gosto de construir: produto real, sistemas distribuídos e IA com dados operacionais, não só uma chamada solta para LLM.

Repo: https://github.com/marcel0paixao/flowpilot-ai

## Initial LinkedIn Post - English

I am adding FlowPilot AI to my portfolio.

It is a workflow automation SaaS with applied AI. The core idea is simple: if a workflow calls a model, that call should be executable, traceable, and measurable.

The MVP already supports a visual workflow builder, async execution through RabbitMQ, a Python/FastAPI AI Orchestrator, and AI traces with provider, model, tokens, latency, status, and estimated cost.

The main demo is an incident triage workflow:

Manual Trigger -> Transform -> Condition -> HTTP Request -> AI Prompt -> Final Output

It receives a high-severity incident, normalizes the payload, adds context, calls a model through OpenRouter, and stores execution observability data.

Stack:

React, Vite, TypeScript, NestJS, Fastify, Prisma, PostgreSQL, RabbitMQ, Redis, Docker Compose, Python/FastAPI, and OpenRouter.

What I wanted to show with this project:

- multi-tenant architecture;
- async worker execution;
- retries, DLQ, idempotency, and outbox events;
- encrypted workspace-scoped credentials;
- AI observability inside a real workflow;
- CI with lint, typecheck, tests, build, and Python validation.

Next steps are Ollama, RAG, benchmarks, and EDA over the trace data.

This is the kind of engineering I enjoy building: real product behavior, distributed systems, and AI with operational data, not just a standalone LLM call.

Repo: https://github.com/marcel0paixao/flowpilot-ai

## Próximo Post Da Série

Tema sugerido:

Como desenhei o AI Orchestrator do FlowPilot AI para suportar providers diferentes, começando por deterministic mock e OpenRouter, e evoluindo para Ollama, OpenAI, LangChain, RAG e benchmarks.

## Próximos Entregáveis Públicos

- Screenshots do workflow builder e execution detail.
- Vídeo curto mostrando a execução ponta a ponta.
- README com arquitetura e comandos de reprodução.
- Case study técnico com métricas da execução.
- Primeiro notebook de EDA analisando traces de IA.
- Comparação OpenRouter vs Ollama local.
