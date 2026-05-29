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

## Post Inicial Para LinkedIn

Estou construindo o FlowPilot AI, uma plataforma SaaS multi-tenant de workflow automation com IA aplicada.

O objetivo do projeto é unir engenharia de software, sistemas distribuídos e Data Science aplicada em um produto realista:

- Backend em NestJS/Fastify com Prisma e PostgreSQL.
- Execução assíncrona com RabbitMQ.
- Worker com lifecycle events, retry e DLQ.
- Frontend em React/Vite/TypeScript com workflow builder visual.
- AI Orchestrator em Python/FastAPI.
- Integração real com LLM via OpenRouter.
- Observabilidade de IA com provider, modelo, tokens, latência, status e custo estimado.

Nesta demo, criei um workflow de triagem de incidente:

Manual Trigger -> Transform -> Condition -> HTTP Request -> AI Prompt -> Final Output

A execução real passou por 6 nodes, chamou um modelo via OpenRouter e registrou um AI trace com 843 tokens e cerca de 27s de latência do provider.

Mais do que chamar uma API de LLM, a ideia é tratar IA como parte mensurável de um sistema: executar, observar, comparar e depois usar esses dados para benchmarks, EDA e decisões sobre custo, latência e confiabilidade.

Esse projeto faz parte do meu portfólio para demonstrar backend, frontend, DevOps, workflow automation, LLM systems e Data Science aplicada.

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
