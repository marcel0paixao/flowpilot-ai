import assert from "node:assert/strict";
import { test } from "node:test";

import {
  eventNames,
  FLOWPILOT_DEAD_LETTER_QUEUES,
  FLOWPILOT_EXCHANGES,
  FLOWPILOT_MAX_RETRY_ATTEMPTS,
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_QUEUES,
  FLOWPILOT_RETRY_DELAYS,
  FLOWPILOT_RETRY_QUEUES,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowExecutionRequestedMessage
} from "./index.js";

test("routing keys stay aligned with exported event names", () => {
  assert.deepEqual(
    [...Object.values(FLOWPILOT_ROUTING_KEYS)].sort(),
    [...eventNames].sort()
  );
});

test("messaging resources follow FlowPilot naming conventions", () => {
  for (const exchange of Object.values(FLOWPILOT_EXCHANGES)) {
    assert.match(exchange, /^flowpilot\./);
  }

  for (const queue of Object.values(FLOWPILOT_QUEUES)) {
    assert.match(queue, /^flowpilot\./);
  }

  for (const retryQueue of Object.values(FLOWPILOT_RETRY_QUEUES)) {
    assert.match(retryQueue, /^flowpilot\.retry\./);
  }

  for (const deadLetterQueue of Object.values(FLOWPILOT_DEAD_LETTER_QUEUES)) {
    assert.match(deadLetterQueue, /^flowpilot\.dlq\./);
  }
});

test("retry policy exposes one delay per attempt", () => {
  assert.equal(Object.values(FLOWPILOT_RETRY_DELAYS).length, FLOWPILOT_MAX_RETRY_ATTEMPTS);
});

test("message producers match service names", () => {
  assert.deepEqual([...Object.values(FLOWPILOT_MESSAGE_PRODUCERS)].sort(), [
    "ai-orchestrator",
    "api",
    "execution-worker",
    "observability-service",
    "workflow-service"
  ]);
});

test("message envelope supports typed event payloads", () => {
  const message = {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
    eventId: "event-1",
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: "2026-05-01T12:00:00.000Z",
    workspaceId: "workspace-1",
    correlationId: "correlation-1",
    producer: FLOWPILOT_MESSAGE_PRODUCERS.api,
    payload: {
      workflowId: "workflow-1",
      workflowVersion: 1,
      executionId: "execution-1",
      requestedBy: {
        type: "user",
        id: "user-1"
      },
      input: {
        hello: "world"
      }
    }
  } satisfies WorkflowExecutionRequestedMessage;

  assert.equal(message.payload.workflowVersion, 1);
});
