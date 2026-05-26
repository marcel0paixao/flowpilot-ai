import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { AiOrchestratorClient } from "./ai-orchestrator-client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("AI orchestrator client posts prompt run requests and returns result payloads", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({
      result: {
        provider: "flowpilot-mock-ai",
        trace: {
          inputKeys: ["email", "leadId"]
        }
      }
    });
  }) as typeof fetch;

  const client = new AiOrchestratorClient("http://ai-orchestrator:8000");

  const result = await client.runPrompt({
    workspaceId: "workspace-1",
    workflowId: "workflow-1",
    executionId: "execution-1",
    nodeExecutionId: "node-execution-ai-summary",
    nodeId: "ai-summary",
    correlationId: "workflow-execution:execution-1",
    input: {
      leadId: "lead-1",
      email: "lead@example.test"
    },
    prompt: "Summarize this lead.",
    provider: "deterministic",
    model: "mock-flowpilot-llm",
    temperature: 0.2
  });

  assert.deepEqual(result, {
    provider: "flowpilot-mock-ai",
    trace: {
      inputKeys: ["email", "leadId"]
    }
  });
  assert.equal(requests.length, 1);
  assert.equal(String(requests[0]?.input), "http://ai-orchestrator:8000/v1/prompts/run");
  assert.equal(requests[0]?.init?.method, "POST");
  assert.deepEqual(requests[0]?.init?.headers, {
    "content-type": "application/json"
  });
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    context: {
      workspaceId: "workspace-1",
      workflowId: "workflow-1",
      executionId: "execution-1",
      nodeExecutionId: "node-execution-ai-summary",
      nodeId: "ai-summary",
      correlationId: "workflow-execution:execution-1"
    },
    config: {
      prompt: "Summarize this lead.",
      provider: "deterministic",
      model: "mock-flowpilot-llm",
      temperature: 0.2
    },
    input: {
      leadId: "lead-1",
      email: "lead@example.test"
    }
  });
});

test("AI orchestrator client rejects non-successful responses", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ detail: "unavailable" }), {
      status: 503,
      headers: {
        "content-type": "application/json"
      }
    })) as typeof fetch;

  const client = new AiOrchestratorClient("http://ai-orchestrator:8000");

  await assert.rejects(
    () => client.runPrompt(validPromptInput()),
    /AI orchestrator request failed with status 503/
  );
});

test("AI orchestrator client rejects responses without result objects", async () => {
  globalThis.fetch = (async () =>
    Response.json({
      status: "ok"
    })) as typeof fetch;

  const client = new AiOrchestratorClient("http://ai-orchestrator:8000");

  await assert.rejects(
    () => client.runPrompt(validPromptInput()),
    /AI orchestrator response did not include a result object/
  );
});

function validPromptInput() {
  return {
    workspaceId: "workspace-1",
    workflowId: "workflow-1",
    executionId: "execution-1",
    nodeExecutionId: "node-execution-ai-summary",
    nodeId: "ai-summary",
    correlationId: "workflow-execution:execution-1",
    input: {
      leadId: "lead-1"
    },
    prompt: "Summarize this lead.",
    provider: "deterministic",
    model: "mock-flowpilot-llm",
    temperature: 0.2
  };
}
