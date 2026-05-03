import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowExecutionRequestedMessage
} from "@flowpilot/contracts";
import type { ConsumeMessage } from "amqplib";

import { parseWorkflowExecutionRequestedMessage } from "./index.js";

test("parses valid workflow execution request messages", () => {
  const parsed = parseWorkflowExecutionRequestedMessage(createConsumeMessage(validMessage()));

  assert.equal(parsed?.eventName, FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested);
  assert.equal(parsed?.payload.executionId, "execution-1");
  assert.deepEqual(parsed?.payload.input, { leadId: "lead-1" });
});

test("rejects invalid workflow execution request messages", () => {
  const invalidMessage = {
    ...validMessage(),
    eventName: FLOWPILOT_ROUTING_KEYS.workflowCreated
  };

  assert.equal(parseWorkflowExecutionRequestedMessage(createConsumeMessage(invalidMessage)), null);
});

test("rejects malformed json messages", () => {
  assert.equal(parseWorkflowExecutionRequestedMessage(createConsumeMessage("{not-json")), null);
});

function validMessage(): WorkflowExecutionRequestedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
    eventId: "event-1",
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: "2026-05-02T12:00:00.000Z",
    workspaceId: "workspace-1",
    correlationId: "workflow-execution:execution-1",
    producer: FLOWPILOT_MESSAGE_PRODUCERS.api,
    actor: {
      type: "user",
      id: "user-1"
    },
    idempotencyKey: "workflow.execution.requested:execution-1",
    payload: {
      workflowId: "workflow-1",
      workflowVersion: 1,
      executionId: "execution-1",
      requestedBy: {
        type: "user",
        id: "user-1"
      },
      input: {
        leadId: "lead-1"
      }
    }
  };
}

function createConsumeMessage(payload: unknown): ConsumeMessage {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);

  return {
    content: Buffer.from(body),
    fields: {
      consumerTag: "test",
      deliveryTag: 1,
      redelivered: false,
      exchange: "flowpilot.commands",
      routingKey: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
    },
    properties: {
      contentType: "application/json",
      contentEncoding: undefined,
      headers: {},
      deliveryMode: 2,
      priority: undefined,
      correlationId: undefined,
      replyTo: undefined,
      expiration: undefined,
      messageId: undefined,
      timestamp: undefined,
      type: undefined,
      userId: undefined,
      appId: undefined,
      clusterId: undefined
    }
  };
}
