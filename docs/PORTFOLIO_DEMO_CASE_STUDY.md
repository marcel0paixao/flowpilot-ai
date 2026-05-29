# Portfolio Demo Case Study

## Demo

`Demo - Real AI Incident Triage`

This case study demonstrates FlowPilot AI as a working multi-tenant workflow automation platform with a real LLM provider in the execution path.

The workflow models a realistic SaaS incident triage process:

1. A manual execution starts with an incident payload.
2. The workflow normalizes the incoming fields.
3. A condition node checks whether the incident is high severity.
4. An HTTP request node adds deterministic customer-context enrichment.
5. An AI prompt node calls OpenRouter through the Python AI Orchestrator.
6. A final transform node returns the portfolio-ready output.

## Product Question

How can an automation platform execute AI-powered workflow steps while preserving operational visibility into latency, provider behavior, token usage, status, and cost?

This demo is intentionally practical. It is not a standalone chatbot. The LLM call is one node inside a larger workflow, and the platform records structured execution data around it.

## Workflow Shape

```txt
Incident Intake
  -> Normalize Incident
  -> Severity Check
  -> Customer Context Lookup
  -> AI Triage Plan
  -> Portfolio Output
```

## Nodes Used

| Node | Type | Purpose |
|---|---|---|
| Incident Intake | `trigger.manual` | Starts the workflow with an incident payload. |
| Normalize Incident | `action.transform` | Keeps the fields needed by the triage flow. |
| Severity Check | `action.condition` | Records whether `severity` equals `high`. |
| Customer Context Lookup | `action.httpRequest` | Uses mock mode to provide repeatable enrichment behavior. |
| AI Triage Plan | `action.aiPrompt` | Calls OpenRouter through the Python AI Orchestrator. |
| Portfolio Output | `action.transform` | Selects the final AI output and trace fields. |

## Example Input

```json
{
  "incidentId": "inc_demo_072",
  "customer": "Apex Fintech",
  "severity": "high",
  "service": "lead-routing-workflows",
  "reportedBy": "ops-director@example.test",
  "slaMinutes": 30,
  "message": "Enterprise sales automations are delayed and high-value leads are not reaching account executives before the pipeline review."
}
```

All names and data in this demo are synthetic.

## Provider Configuration

The AI node uses:

| Field | Value |
|---|---|
| Provider | `openrouter` |
| Model | `openai/gpt-oss-20b:free` |
| Credential | Workspace-scoped encrypted credential referenced by `credentialId` |
| Temperature | `0.2` |

The workflow definition stores the credential ID, not the raw API key. The Python AI Orchestrator resolves the secret through the API's internal credential endpoint.

## Observability Captured

The successful demo execution captured:

| Metric | Value |
|---|---|
| Execution status | `SUCCEEDED` |
| Nodes completed | `6/6` |
| Timeline events | `14` |
| AI trace status | `SUCCEEDED` |
| Provider | `openrouter` |
| Model | `openai/gpt-oss-20b:free` |
| Input tokens | `452` |
| Output tokens | `391` |
| Total tokens | `843` |
| Estimated cost | `0` |
| Provider latency | `27402 ms` |
| End-to-end execution duration | `29.1 s` |

These fields are useful for future analysis: latency distribution, provider reliability, token/cost trends, model comparison, and failure analysis.

## What This Demonstrates

- Backend architecture with NestJS, Prisma, PostgreSQL, RabbitMQ, and worker execution.
- Python AI service boundary with FastAPI, Pydantic, provider abstraction, and OpenRouter integration.
- Multi-tenant credential handling without storing provider secrets in workflow definitions.
- Workflow node execution with persisted lifecycle events.
- AI observability with provider/model/status/token/latency/error metadata.
- Frontend workflow builder and execution detail views.
- Product-minded use of LLMs inside a real automation flow, not as an isolated prompt playground.

## Why The HTTP And RabbitMQ Split Matters

The workflow execution request is asynchronous through RabbitMQ. Once the worker is executing a specific AI node, the worker calls the AI Orchestrator over HTTP because it needs the model output before continuing the DAG.

RabbitMQ remains the right path for:

- Workflow execution requests.
- Node lifecycle events.
- `ai.trace.created` events.
- Future benchmark jobs.
- Future document ingestion and embedding jobs.

HTTP remains the right path for:

- Synchronous AI node execution where the next node depends on the AI result.
- Health checks.
- Local FastAPI OpenAPI exploration.

## Current Limitations

- The HTTP request node's demo path uses mock mode for stable portfolio reproduction.
- OpenRouter latency can vary, so the execution worker timeout is configurable through `AI_ORCHESTRATOR_TIMEOUT_MS`.
- LangChain, Ollama, OpenAI direct provider support, RAG, benchmark exports, and EDA notebooks are planned next phases.
- The current observability MVP is stored in workflow execution tables; a dedicated observability service is still a future extraction point.

## Next Portfolio Improvements

- Add a reproducible seed/script for this exact demo workflow.
- Add screenshots of the workflow canvas and execution detail page.
- Add a small benchmark dataset export from repeated AI runs.
- Add the first EDA notebook comparing latency, token usage, and provider status.
- Add Ollama as the first local-model provider and compare it with OpenRouter.
