# Demo Guide

## Goal

This guide reproduces the portfolio workflow demo from a fresh local environment.

The demo shows FlowPilot AI running a realistic incident triage workflow with:

- Manual workflow execution.
- Transform node.
- Condition node.
- HTTP request node in mock mode.
- AI prompt node through the Python AI Orchestrator.
- Execution detail observability with node progress, timeline, execution data, diagnostics, and AI traces.

## Start The Stack

```bash
docker compose up -d
```

Then seed the demo workspace and workflows:

```bash
pnpm --filter @flowpilot/api seed:demo
```

The seed creates:

- Workspace: `Acme Automation`
- Login: `owner@acme.test`
- Password: `correct horse battery staple`
- Workflow: `Lead Enrichment`
- Portfolio workflow: `Demo - Real AI Incident Triage`

## Run The Portfolio Workflow

Open the web app:

```txt
http://localhost:5173
```

Sign in with the seeded user and open:

```txt
Workflows -> Demo - Real AI Incident Triage
```

Use this execution input:

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

The seeded workflow uses the deterministic provider by default so the demo can run without an external API key.

## Optional Real Provider Demo

To run the AI node with OpenRouter:

1. Open `Credentials`.
2. Add an `OpenRouter` credential.
3. Open `Demo - Real AI Incident Triage`.
4. Edit `AI Triage Plan`.
5. Set provider to `OpenRouter`.
6. Select the compatible credential.
7. Keep or change the model, for example `openai/gpt-oss-20b:free`.
8. Save a new workflow version.
9. Run the workflow again.

The execution detail page should show an AI trace with provider, model, status, token usage, estimated cost, finish reason, and provider latency.

## What To Capture For A Portfolio Demo

Reference screenshots:

### Workflow Builder

![Workflow builder showing the complete incident triage workflow](assets/demo-workflow-builder.png)

### AI Node Configuration

![AI node configuration with provider, model, credential, temperature, system prompt, and prompt](assets/demo-ai-node-config.png)

### Execution Summary

![Execution detail summary cards](assets/demo-execution-summary.png)

### AI Traces

![AI traces tab with provider, tokens, cost, and latency](assets/demo-ai-traces.png)

### Execution Data

![Execution data tab with input and output JSON](assets/demo-execution-data.png)

### Timeline Event Modal

![Timeline modal with event metadata and JSON payload](assets/demo-timeline-modal.png)

### Credentials

![Credentials page with provider-based key management](assets/demo-credentials.png)

### Short GIF

![Short FlowPilot AI demo walkthrough](assets/flowpilot-linkedin-demo.gif)

Recommended talking points:

- RabbitMQ handles asynchronous workflow execution.
- The worker calls the Python AI Orchestrator synchronously for AI node output.
- Credentials are workspace-scoped and referenced by ID from workflow definitions.
- AI traces turn LLM calls into structured operational data.
- The same workflow can run against deterministic, OpenRouter, and future local/cloud providers.
