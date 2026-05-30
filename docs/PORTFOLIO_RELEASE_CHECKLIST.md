# Portfolio Release Checklist

## Goal

Prepare FlowPilot AI for a public portfolio post and recruiter/interviewer review.

This checklist assumes the MVP demo is the `Demo - Real AI Incident Triage` workflow.

## Before Recording

- Run `docker compose up -d`.
- Run `pnpm --filter @flowpilot/api seed:demo`.
- Confirm `http://localhost:5173` opens.
- Sign in with `owner@acme.test`.
- Confirm the workflow `Demo - Real AI Incident Triage` is visible.
- Confirm the execution detail page shows:
  - total nodes
  - successful nodes
  - failed nodes
  - AI traces
  - total tokens
  - estimated cost
  - total latency
- Confirm the `Credentials` page explains provider-compatible credentials.

## Demo Script

1. Open the workflow list.
2. Open `Demo - Real AI Incident Triage`.
3. Show the workflow builder and name the node chain:
   `Manual Trigger -> Transform -> Condition -> HTTP Request -> AI Prompt -> Final Output`.
4. Explain that the seeded version uses deterministic AI for reproducibility.
5. Open the AI node and show provider, model, credential, temperature, system prompt, and prompt fields.
6. Open the Credentials page and explain workspace-scoped encrypted provider keys.
7. Run the workflow with the sample incident payload from `docs/DEMO_GUIDE.md`.
8. Open the execution detail page.
9. Show node progress and timeline.
10. Open AI traces and point to provider/model/status/tokens/latency/cost.
11. Open Data and show input/output JSON.
12. Close by explaining that this data enables future EDA, provider comparison, and model recommendation.

## Short Video Outline

Target duration: 30-60 seconds.

| Segment | Time | Message |
|---|---:|---|
| Context | 0-8s | FlowPilot AI is a multi-tenant workflow automation SaaS with AI nodes. |
| Workflow | 8-18s | Show the incident triage workflow and its node chain. |
| AI Config | 18-28s | Show provider, model, credential, temperature, and prompt configuration. |
| Execution | 28-42s | Run or show a completed execution. |
| Observability | 42-55s | Show AI traces, tokens, latency, cost, timeline, and output data. |
| Close | 55-60s | Mention next steps: benchmarks, EDA, Ollama, RAG, and model comparison. |

## LinkedIn Post Checklist

- Include one screenshot of the workflow builder.
- Include one screenshot of the execution detail or AI traces tab.
- Link to the GitHub repository.
- Explain the problem in product terms, not just technology terms.
- Mention the stack briefly.
- Mention what is real today:
  - workflow execution
  - RabbitMQ worker
  - Python AI Orchestrator
  - OpenRouter provider
  - credentials
  - AI traces
- Mention next steps:
  - Ollama local provider
  - benchmark exports
  - EDA notebook
  - RAG

## Repository Review Checklist

- README describes what is implemented versus planned.
- `docs/DEMO_GUIDE.md` has reproduction steps and screenshots.
- `docs/PORTFOLIO_DEMO_CASE_STUDY.md` explains the case study.
- `docs/AI_ORCHESTRATOR.md` explains provider abstraction and AI roadmap.
- `docs/ARCHITECTURE.md` explains service boundaries.
- No raw API keys or private prompts are committed.
- Demo data is synthetic.

## Suggested Resume Bullet

Built FlowPilot AI, a multi-tenant workflow automation platform with RabbitMQ-based execution, a Python/FastAPI AI Orchestrator, provider-configurable LLM nodes, encrypted workspace credentials, and AI observability for tokens, latency, status, cost, and provider behavior.
