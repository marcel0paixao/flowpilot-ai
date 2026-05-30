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

Estou construindo o FlowPilot AI, uma plataforma SaaS multi-tenant de workflow automation com IA aplicada.

A ideia nasceu de um problema que acho cada vez mais importante: workflows com IA não podem ser apenas chamadas soltas para um modelo. Eles precisam ser executáveis, observáveis e comparáveis.

Em outras palavras: quando um workflow usa IA, eu quero saber qual provider foi usado, qual modelo respondeu, quanto tempo levou, quantos tokens consumiu, quanto custou, se falhou, por que falhou e como comparar esse comportamento com outros modelos no futuro.

O FlowPilot AI já tem um MVP funcional com:

- Workflow builder visual.
- Execution worker assíncrono com RabbitMQ.
- AI Orchestrator em Python/FastAPI.
- Providers configuráveis no node de IA.
- Credenciais criptografadas e workspace-scoped.
- Traces de IA com tokens, latência, provider, modelo, status e custo estimado.
- Tela de execução com node progress, timeline, payloads e observability.

Na demo principal, criei um workflow de triagem de incidente:

Manual Trigger -> Transform -> Condition -> HTTP Request -> AI Prompt -> Final Output

O caso simula uma empresa SaaS recebendo um incidente de alta severidade em automações de vendas. O workflow normaliza o payload, avalia severidade, adiciona contexto, chama um modelo via AI Orchestrator e registra os dados operacionais da execução.

Stack usada:

- NestJS/Fastify
- React/Vite/TypeScript
- PostgreSQL/Prisma
- RabbitMQ
- Redis
- Docker Compose
- Python/FastAPI
- OpenRouter como primeiro provider real de LLM

O objetivo do projeto não é ser “mais um app com IA”, mas um showcase de engenharia + IA aplicada: construir workflows reais, medir comportamento de modelos e preparar a base para decisões orientadas por dados.

Próximos passos:

- Rodar modelos locais com Ollama.
- Criar benchmarks multi-modelo.
- Exportar traces para EDA.
- Adicionar RAG com Qdrant.
- Comparar custo, latência, confiabilidade e qualidade entre modelos cloud e locais.

Estou compartilhando a evolução do projeto como parte do meu portfólio em backend, AI engineering e ML systems.

Feedbacks, conexões e oportunidades em backend/AI/ML systems são muito bem-vindos.

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
