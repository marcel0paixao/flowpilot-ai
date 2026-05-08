import assert from "node:assert/strict";
import { test } from "node:test";

import { runDeterministicAiPrompt } from "./index.js";

test("deterministic AI prompt returns repeatable mock output", () => {
  const result = runDeterministicAiPrompt({
    input: {
      email: "lead@example.test",
      leadId: "lead-1"
    },
    model: "mock-flowpilot-llm",
    prompt: "Summarize this lead.",
    temperature: 0.2
  });

  assert.equal(result.provider, "flowpilot-mock-ai");
  assert.equal(result.trace.deterministic, true);
  assert.deepEqual(result.trace.inputKeys, ["email", "leadId"]);
  assert.match(result.summary, /2 input fields/);
});
