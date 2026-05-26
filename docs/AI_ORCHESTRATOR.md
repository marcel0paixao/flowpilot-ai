# AI Orchestrator

## Purpose

The FlowPilot AI Orchestrator is the data-driven AI execution service inside FlowPilot AI. It is not intended to be only a thin wrapper around LLM APIs. Its role is to execute AI workflow nodes, collect structured operational data, compare model behavior, support applied evaluation, and make AI decisions measurable inside a production-style workflow automation system.

Central product and research question:

```txt
How can AI workflow execution be evaluated and optimized with operational data, comparing local and cloud models across cost, latency, reliability, and response quality?
```

This question guides the implementation. Every major AI feature should either improve workflow execution, produce useful measurement data, support model comparison, or enable better data-driven decisions.

## Portfolio Goal

FlowPilot AI should demonstrate practical overlap between software engineering, data engineering, ML systems, and applied data science.

The AI Orchestrator is designed to show:

- Production-minded backend design with FastAPI, typed schemas, provider boundaries, and tests.
- LLM orchestration with deterministic mocks first, then LangChain, OpenAI, and local models.
- Operational data collection for latency, status, errors, retries, tokens, cost, input/output size, and schema validity.
- Model evaluation across cloud and local providers.
- RAG and vector search as product features, not disconnected experiments.
- Exportable datasets and notebooks for EDA and model performance analysis.
- Applied ML that helps the product predict risk, cost, or latency before execution.
- Technical communication through architecture docs, methodology notes, case studies, and reproducible demos.

## Current Scope

The first implementation is intentionally small:

- Python 3.12.
- FastAPI service under `apps/ai-orchestrator`.
- Pydantic request and response schemas.
- `GET /health`.
- `POST /v1/prompts/run`.
- Deterministic mock provider.
- Dockerfile and Docker Compose service.
- Pytest and Ruff checks.

This creates the service boundary before adding real model providers, LangChain, RAG, persistence, or analytics.

## Product Role

Inside FlowPilot AI, the AI Orchestrator should eventually support workflow nodes such as:

- AI prompt execution.
- Structured extraction from text.
- Text classification.
- Summarization.
- Retrieval-augmented generation.
- Document question answering.
- Model comparison runs.
- Benchmark runs.
- Model recommendation for a workflow task.

The execution worker remains responsible for workflow state, node progression, retries at the workflow level, outbox events, and persisted workflow execution records. The AI Orchestrator owns AI-specific behavior, model/provider selection, prompt execution details, AI metrics, and future AI traces.

## Why Python

Python is the right service boundary for this part of the system because the AI and data science ecosystem is strongest there:

- FastAPI for typed HTTP APIs and OpenAPI documentation.
- Pydantic for runtime schema validation.
- LangChain for LLM orchestration, chains, tools, and RAG workflows.
- Qdrant client and embedding libraries for vector search.
- pandas, Polars, scikit-learn, matplotlib, and notebooks for EDA and applied ML.
- Ollama and local model integrations for local LLM experiments.

The rest of the platform can stay TypeScript-first where that makes sense: product API, workflow state, frontend, contracts, RBAC, RabbitMQ topology, worker orchestration, and web UI.

## Communication Pattern

Prompt execution starts as synchronous HTTP:

```txt
execution-worker -> ai-orchestrator -> provider/model -> ai-orchestrator -> execution-worker
```

This fits `action.aiPrompt` because the worker needs the AI output before continuing to the next node in the workflow DAG.

RabbitMQ remains the asynchronous backbone for:

- `ai.trace.created`.
- Document ingestion jobs.
- Embedding batch jobs.
- Reindexing.
- Offline evaluations.
- Benchmark runs that should not block a workflow execution.
- Analytics pipelines.

The rule of thumb:

- Use HTTP when a workflow node needs an immediate output.
- Use RabbitMQ when the task is event-driven, long-running, fan-out, or observational.

## Initial HTTP Contract

Endpoint:

```txt
POST /v1/prompts/run
```

Request shape:

```json
{
  "context": {
    "workspaceId": "workspace-1",
    "workflowId": "workflow-1",
    "executionId": "execution-1",
    "nodeExecutionId": "node-execution-1",
    "nodeId": "ai-node",
    "correlationId": "correlation-1"
  },
  "config": {
    "prompt": "Summarize this lead.",
    "provider": "deterministic",
    "model": "mock-flowpilot-llm",
    "temperature": 0.2
  },
  "input": {
    "leadId": "lead-1",
    "email": "lead@example.test"
  }
}
```

Response shape:

```json
{
  "result": {
    "provider": "deterministic",
    "model": "mock-flowpilot-llm",
    "prompt": "Summarize this lead.",
    "temperature": 0.2,
    "summary": "Mock AI response for 2 input fields: email, leadId.",
    "tokens": {
      "input": 16,
      "output": 12
    },
    "trace": {
      "deterministic": true,
      "inputKeys": ["email", "leadId"]
    }
  }
}
```

The response is intentionally compatible with the current deterministic AI node output shape. `config.provider` selects the provider implementation from the AI Orchestrator registry. Unknown provider names return HTTP `422` with an `unknown_ai_provider` error code. When observability metadata is added, the worker should still be able to persist a clean node output while trace data flows through an AI trace path.

## Core Architecture

Recommended service structure:

```txt
apps/ai-orchestrator/
  Dockerfile
  README.md
  pyproject.toml
  src/
    flowpilot_ai_orchestrator/
      __init__.py
      main.py
      config.py
      api/
        __init__.py
        routes.py
        dependencies.py
      schemas/
        __init__.py
        prompts.py
        traces.py
        evaluations.py
        benchmarks.py
      services/
        __init__.py
        prompt_service.py
        benchmark_service.py
        evaluation_service.py
        recommendation_service.py
      providers/
        __init__.py
        base.py
        registry.py
        deterministic/
          __init__.py
          provider.py
        openai.py
        ollama.py
      langchain/
        __init__.py
        chains.py
        prompts.py
        output_parsers.py
      rag/
        __init__.py
        embeddings.py
        retriever.py
        qdrant_store.py
        ingestion.py
      observability/
        __init__.py
        metrics.py
        tracing.py
        cost.py
      persistence/
        __init__.py
        models.py
        repositories.py
      analytics/
        __init__.py
        exports.py
        feature_builder.py
      ml/
        __init__.py
        training.py
        prediction.py
        explainability.py
  tests/
    unit/
    api/
    contract/
    fixtures/
  notebooks/
    01_execution_eda.ipynb
    02_model_comparison.ipynb
    03_failure_latency_prediction.ipynb
  docs/
    data_dictionary.md
    experimental_methodology.md
    model_cards.md
```

The current service does not need all of these folders immediately. This is a target structure to grow toward as features become real.

## Key Patterns

### Provider Abstraction

Every model provider should implement a common interface.

Examples:

- `DeterministicProvider`.
- `OpenAIProvider`.
- `OllamaProvider`.
- Future `AnthropicProvider`.

The workflow should select provider/model through node config. The rest of the service should not care whether the model is cloud-hosted or local.

### Service Layer

FastAPI routes should stay thin:

```txt
route -> schema validation -> service -> provider/repository/metrics -> response
```

Business logic belongs in service classes, not route functions.

### DTOs With Pydantic

Pydantic models should define strict API boundaries:

- Request validation.
- Response validation.
- OpenAPI generation.
- Contract tests.
- Schema compatibility with TypeScript worker calls.

### Deterministic First

The deterministic provider is not throwaway code. It is the baseline that makes tests repeatable and gives benchmark tooling a stable control condition.

### Observability Boundary

AI execution should produce structured trace records rather than only application logs.

The trace boundary should capture:

- `traceId`.
- Workspace, workflow, execution, and node identifiers.
- Provider and model.
- Prompt template/version.
- Input size.
- Output size.
- Latency.
- Status.
- Error code/message.
- Retry count.
- Token usage.
- Estimated cost.
- Schema validation result.
- JSON validity.
- Quality metrics when ground truth exists.

### Data-Driven Evolution

Analytics and ML should come from real product data:

- If EDA exists, it analyzes execution traces.
- If ML exists, it predicts something useful for workflow execution.
- If model comparison exists, it is grounded in benchmark runs and measurable task outcomes.
- If local LLM support exists, it is compared against cloud providers in cost, latency, reliability, and quality.

## Provider And Model Comparison

The AI Orchestrator should eventually support practical comparisons such as:

```txt
OpenAI GPT model vs local Llama through Ollama
```

Comparison dimensions:

- Latency distribution.
- Average and p95 latency.
- Success rate.
- Error rate.
- Retry rate.
- Timeout rate.
- Token usage.
- Estimated cost.
- Output size.
- Schema validity rate.
- Invalid JSON rate.
- Ground-truth quality metrics.
- Field-level extraction accuracy.

The point is not simply to run a local model. The point is to answer product questions:

- When is a local model good enough?
- When is a paid API worth the cost?
- Which provider is more reliable for structured extraction?
- Which model gives the best latency/cost/quality tradeoff for a task type?

## Benchmarking

Benchmarks should be controlled, repeatable, and connected to workflow tasks.

Benchmark inputs:

- Task type.
- Prompt template/version.
- Provider.
- Model.
- Temperature.
- Input fixture.
- Optional ground truth.
- Repetition count.

Benchmark outputs:

- Per-run execution records.
- Aggregated metrics.
- Model comparison tables.
- Exportable CSV/JSON datasets.
- Notebook-ready analysis files.

Example benchmark question:

```txt
For lead enrichment extraction, which model has the best schema validity and field-level accuracy under a 2 second p95 latency target?
```

## Ground Truth And Quality Metrics

When a task has an expected answer, the AI Orchestrator should support evaluation.

Useful task types:

- Classification.
- JSON extraction.
- Entity extraction.
- Sentiment or intent labeling.
- Summarization with rubric-based scoring later.

Useful metrics:

- Accuracy.
- Precision.
- Recall.
- F1.
- Schema validity rate.
- Invalid JSON rate.
- Field-level accuracy.
- Exact match for required fields.
- Missing-field rate.
- Hallucinated-field rate.

Not every workflow needs ground truth. The feature should be applied where it creates real signal.

## Analytics And EDA

The service should generate datasets that can be exported or queried for analysis.

Possible datasets:

- AI execution traces.
- Model benchmark runs.
- Provider/model metrics.
- Error records.
- Schema validation results.
- Ground truth evaluation results.
- Cost estimates.

Notebook topics:

- Latency distribution by provider/model.
- Failure rate by task type.
- Average cost per workflow execution.
- Correlation between input size and latency.
- Local vs cloud model comparison.
- Reliability by schema complexity.
- Token usage distribution.
- Quality metrics by prompt version.

The notebooks should be reproducible and explain what operational decision each analysis supports.

## Applied ML Layer

An advanced version can include a simple ML model that predicts workflow or AI execution behavior before execution.

Practical prediction targets:

- Failure risk.
- Timeout risk.
- Estimated latency.
- Estimated cost.
- Probability of invalid JSON.
- Recommended provider/model for a task.

Initial model candidates:

- Logistic Regression for failure/invalid-output risk.
- Random Forest for nonlinear tabular patterns.
- Gradient boosting later if useful.

Feature examples:

- Provider.
- Model.
- Task type.
- Prompt length.
- Input size.
- Expected output schema complexity.
- Temperature.
- Previous model reliability.
- Workflow node type.

The ML layer should include:

- Train/test split.
- Baseline comparison.
- Metrics.
- Feature importance or simple explainability.
- Clear limitations.
- A real integration point, such as pre-execution model recommendation or risk warning.

## Recommendation Layer

The recommendation layer can start as a transparent heuristic:

```txt
Choose the cheapest model that meets task-specific reliability and latency thresholds.
```

Inputs:

- Task type.
- Required schema strictness.
- Max acceptable latency.
- Max acceptable cost.
- Historical failure rate.
- Historical quality score.

Outputs:

- Recommended provider.
- Recommended model.
- Reason codes.
- Expected cost/latency/reliability.

Later, this can evolve into an ML-backed recommender once enough execution data exists.

## Data Model Candidates

Future persistence can introduce tables or collections such as:

- `AiTrace`.
- `AiProviderRun`.
- `AiBenchmark`.
- `AiBenchmarkRun`.
- `AiEvaluation`.
- `AiGroundTruthExample`.
- `AiModelRecommendation`.
- `AiPromptTemplate`.
- `AiDatasetExport`.

These should be added only when the product path needs durable data, not before.

## Public Portfolio Deliverables

Recommended public artifacts:

- Main README with a clear product narrative.
- AI Orchestrator architecture document.
- AI Orchestrator roadmap/status document.
- Data dictionary for trace and benchmark datasets.
- Experimental methodology document.
- Notebook-based EDA.
- Model comparison case study.
- RAG workflow demo.
- Local vs cloud model benchmark.
- Screenshots of workflow builder and execution detail.
- Short demo video.
- Example workflow definitions.
- Example exported datasets with synthetic or non-sensitive data.
- Model/provider comparison table.

## Skills Demonstrated

The complete AI Orchestrator direction demonstrates:

- Backend engineering with Python/FastAPI.
- API design and schema validation.
- Service boundaries and containerized development.
- Workflow automation systems.
- RabbitMQ-based asynchronous architecture.
- LLM orchestration.
- Provider abstraction.
- Local and cloud model comparison.
- RAG and vector search.
- Observability and trace design.
- Data collection and modeling.
- Analytics and EDA.
- Applied ML for operational prediction.
- Experiment design and model evaluation.
- Technical writing and portfolio communication.

## Suggested Additions

The following additions would strengthen the project without making it artificial:

- Prompt template versioning so quality can be compared across prompt changes.
- Dataset versioning for benchmark fixtures.
- Synthetic benchmark datasets to avoid privacy concerns.
- A small "model card" page for each provider/model used in benchmarks.
- A model recommendation explanation panel in the UI.
- Export endpoints for CSV/JSON benchmark results.
- A public case study: "OpenAI vs local Llama for structured extraction in workflow automation."
- A "cost guardrail" setting that blocks expensive models for low-priority workflows.
- A "schema strictness" setting that routes structured extraction tasks toward models with better JSON validity.

These additions all connect to real product needs: cost control, reliability, evaluation, and explainability.
