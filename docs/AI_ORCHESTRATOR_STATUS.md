# AI Orchestrator Status And Roadmap

## Current State

The AI Orchestrator has been scaffolded as a Python/FastAPI service under `apps/ai-orchestrator`.

Current capabilities:

- Python 3.12 service.
- FastAPI app.
- Dockerfile.
- Docker Compose service.
- Pydantic schemas.
- `GET /health`.
- `POST /v1/prompts/run`.
- Deterministic mock provider.
- OpenRouter provider.
- Credential lookup through the API internal credential endpoint.
- Provider base interface and registry.
- Provider selection through `action.aiPrompt.config.provider`.
- Unknown provider names return HTTP `422`.
- Pytest test suite.
- Ruff linting.
- Execution worker integration through HTTP.
- Docker Compose local smoke path for `action.aiPrompt`.
- AI trace persistence in the workflow execution path.
- AI trace UI in execution detail views.
- Benchmark CLI entrypoint for controlled prompt runs.

Current limitation:

- LangChain, Ollama, OpenAI, RAG, benchmark dataset export, EDA notebooks, and model quality evaluation are still future phases.

## Guiding Question

```txt
How can AI workflow execution be evaluated and optimized with operational data, comparing local and cloud models across cost, latency, reliability, and response quality?
```

The roadmap should keep implementation grounded in this question.

## MVP Phase

Goal: make the Python AI Orchestrator a real workflow dependency while keeping the implementation deterministic and testable.

### Scope

- Keep deterministic provider as the default.
- Define stable request/response contracts for prompt execution.
- Add contract fixtures for `/v1/prompts/run`.
- Add invalid payload tests and schema validation tests.
- Integrate the TypeScript execution worker with the Python service over HTTP. Completed.
- Remove the old local TypeScript AI orchestrator package dependency. Completed.
- Preserve existing `action.aiPrompt` behavior shape.
- Add timeouts and clear error mapping in the worker's HTTP client.
- Keep Docker Compose as the single local startup path.

### Deliverables

- Python service is called by the execution worker.
- `action.aiPrompt` still passes deterministic tests.
- Docker Compose starts the full stack.
- API docs expose AI Orchestrator OpenAPI through FastAPI.
- Contract fixture documents the worker-to-orchestrator payload.

### Tests

- Provider unit tests.
- FastAPI route tests.
- Invalid payload tests.
- Contract fixture tests.
- Worker unit tests for successful AI HTTP execution.
- Worker unit tests for AI timeout/error handling.
- Docker smoke test for `/health`.

### Definition Of Done

- `docker compose up -d --build` starts the stack.
- `docker compose run --rm ai-orchestrator python -m pytest` passes.
- `docker compose run --rm ai-orchestrator python -m ruff check .` passes.
- `pnpm --filter @flowpilot/execution-worker test` passes.
- A workflow with `action.aiPrompt` succeeds through the Python service.

Current MVP status:

- Contract fixtures, API validation tests, and provider unit tests are in place.
- Provider registry tests are in place.
- The worker calls the Python service over HTTP.
- The old local TypeScript AI orchestrator dependency has been removed from the worker.
- A Docker smoke execution has confirmed `action.aiPrompt` succeeds through the Python service.
- Worker error mapping distinguishes retryable AI Orchestrator failures from non-retryable semantic errors.
- OpenRouter is available as the first real cloud provider behind the provider registry.
- Workflow executions persist AI traces with provider, model, status, latency, token usage, cost estimate, input/output size, and error metadata.
- The UI exposes node progress, execution data, timeline details, diagnostics, and AI trace summaries.
- A portfolio demo workflow has executed successfully against OpenRouter using the full MVP node chain: manual trigger, transform, condition, HTTP request, AI prompt, and final transform.

Remaining MVP hardening:

- Add a stable seeded or scripted demo fixture for the portfolio workflow. Completed.
- Add a short public demo guide with reproduction steps. Completed.
- Add screenshots to the public demo guide. Completed.
- Add a portfolio release checklist and demo video outline. Completed.
- Add exportable trace/benchmark data for the first EDA notebook.

## Intermediate Phase

Goal: turn the AI Orchestrator into a measurable provider/model execution system.

### Scope

- Provider interface and registry are in place.
- Add `OpenRouterProvider` as the first real cloud provider.
- Add `OllamaProvider` for local Llama models.
- Add `OpenAIProvider` after OpenRouter and Ollama prove the provider boundary.
- Add provider/model selection in `action.aiPrompt` config.
- Add LangChain for prompt execution and output parsing.
- Add structured output parsing and schema validation.
- Add AI trace records with latency, provider, model, status, token usage, cost estimate, input size, output size, and schema validity.
- Emit or prepare `ai.trace.created`.
- Add benchmark runner for repeated executions across provider/model combinations.
- Add CSV/JSON export for benchmark and trace data.

### Deliverables

- Cloud model execution path.
- Local model execution path.
- Provider comparison benchmark command or endpoint.
- Trace dataset export.
- Data dictionary for trace fields.
- Initial notebook for latency/cost/error EDA.

### Tests

- Provider contract tests.
- Mocked OpenRouter tests.
- Mocked Ollama tests.
- Mocked OpenAI tests.
- LangChain chain tests with fake models.
- Schema validity tests.
- Benchmark service tests.
- Export format tests.

### Definition Of Done

- The same prompt task can run against deterministic, OpenAI, and Ollama providers.
- Each run produces structured metrics.
- Benchmark data can be exported and analyzed in a notebook.
- Documentation explains how to reproduce one model comparison.

## Advanced Phase

Goal: make the AI Orchestrator a data-driven ML/LLM evaluation and recommendation component.

### Scope

- Add Qdrant-backed RAG.
- Add document ingestion and embedding jobs.
- Add retrieval metrics.
- Add ground truth datasets for selected tasks.
- Add quality evaluation for classification and structured extraction.
- Add metrics such as accuracy, precision, recall, F1, schema validity rate, invalid JSON rate, and field-level accuracy.
- Add applied ML model for failure, cost, or latency prediction.
- Add model recommendation service based on cost, latency, reliability, and quality.
- Add notebooks for EDA, model comparison, and risk/latency prediction.
- Add portfolio case study and public demo artifacts.

### Deliverables

- RAG workflow example.
- OpenAI vs local Llama benchmark report.
- Structured extraction benchmark with ground truth.
- Notebook showing latency/cost/failure analysis.
- Simple ML model with metrics and explainability.
- Recommendation endpoint or internal service.
- Portfolio case study with screenshots and results.

### Tests

- RAG retrieval tests with fixture documents.
- Evaluation metric tests.
- Dataset export tests.
- ML feature builder tests.
- Recommendation heuristic tests.
- End-to-end benchmark smoke test.

### Definition Of Done

- The project can answer at least one data-driven model selection question with evidence.
- A reader can reproduce a benchmark and inspect the exported dataset.
- The UI or API can explain why one model/provider is recommended for a task.
- The docs include methodology, data dictionary, and a concise case study.

## Roadmap Checklist

### MVP Checklist

- Add contract fixture for `/v1/prompts/run`.
- Add provider unit tests.
- Add provider registry tests.
- Add invalid payload tests.
- Add unknown provider API validation.
- Add worker HTTP client.
- Remove worker dependency on local TypeScript AI package.
- Update Docker Compose worker dependency on `ai-orchestrator`.
- Run workflow smoke test with `action.aiPrompt`.
- Update docs after integration.

### Intermediate Checklist

- Add OpenRouter provider behind config. Completed.
- Add portfolio workflow using OpenRouter. Completed.
- Add AI trace persistence. Completed.
- Add AI trace execution UI. Completed.
- Add benchmark runner. Started.
- Add Ollama provider behind config.
- Add OpenAI provider behind config.
- Add LangChain prompt execution.
- Add structured output parsing.
- Add CSV/JSON export.
- Add first EDA notebook.

### Advanced Checklist

- Add Qdrant client.
- Add embedding provider abstraction.
- Add document ingestion.
- Add RAG retrieval.
- Add ground truth fixture format.
- Add evaluation metrics.
- Add benchmark report.
- Train simple ML model for risk, cost, or latency.
- Add model recommendation heuristic.
- Publish portfolio case study.

## Portfolio Deliverables

Public deliverables to prepare as the roadmap matures:

- Updated main README.
- AI Orchestrator architecture doc.
- AI Orchestrator status/roadmap doc.
- Data dictionary.
- Experimental methodology.
- Notebook: execution trace EDA.
- Notebook: local vs cloud model comparison.
- Notebook: workflow failure or latency prediction.
- Case study: model selection for structured extraction.
- Screenshots of workflow builder and execution views.
- Demo video.
- Synthetic benchmark dataset.
- Example workflow definitions.

## Risks And Guardrails

- Avoid adding Data Science features that do not connect to real execution data.
- Keep the deterministic provider as the test baseline.
- Keep benchmark datasets synthetic or non-sensitive.
- Avoid provider-specific logic leaking into workflow execution code.
- Add persistence only when there is a query, export, benchmark, or product view that needs it.
- Keep advanced ML simple and explainable unless the data volume justifies more complexity.
