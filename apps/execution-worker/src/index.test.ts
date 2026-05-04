import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FLOWPILOT_EXCHANGES,
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_RETRY_ROUTING_KEYS,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowExecutionRequestedMessage
} from "@flowpilot/contracts";
import type { Channel, ConsumeMessage } from "amqplib";
import type { PrismaClient } from "@prisma/client/index";

import {
  dispatchPendingOutboxMessages,
  getWorkflowExecutionRetryAttempt,
  handleDelivery,
  parseWorkflowExecutionRequestedMessage,
  processWorkflowExecution
} from "./index.js";

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

test("reads retry attempts from AMQP headers", () => {
  assert.equal(
    getWorkflowExecutionRetryAttempt(
      createConsumeMessage(validMessage(), {
        headers: {
          "x-flowpilot-retry-attempt": 2
        }
      })
    ),
    2
  );

  assert.equal(
    getWorkflowExecutionRetryAttempt(
      createConsumeMessage(validMessage(), {
        headers: {
          "x-flowpilot-retry-attempt": "3"
        }
      })
    ),
    3
  );

  assert.equal(getWorkflowExecutionRetryAttempt(createConsumeMessage(validMessage())), 0);
});

test("skips processing when workflow execution is already terminal", async () => {
  const channel = createFakeChannel();
  const prisma = {
    workflowExecution: {
      findUnique: async () => ({
        id: "execution-1",
        workflowId: "workflow-1",
        workspaceId: "workspace-1",
        status: "SUCCEEDED",
        startedAt: new Date("2026-05-02T12:00:00.000Z")
      }),
      updateMany: async () => {
        throw new Error("terminal executions must not be updated");
      }
    },
    outboxMessage: {
      findMany: async () => []
    }
  } as unknown as PrismaClient;

  await processWorkflowExecution(validMessage(), channel, prisma);

  assert.equal(channel.published.length, 0);
});

test("schedules retry and acknowledges retryable failures before max attempts", async () => {
  const channel = createFakeChannel();
  const prisma = {
    workflowExecution: {
      findUnique: async () => {
        throw new Error("temporary database outage");
      }
    }
  } as unknown as PrismaClient;

  await handleDelivery(createConsumeMessage(validMessage()), channel, prisma);

  assert.equal(channel.acked, true);
  assert.equal(channel.nacked, false);
  assert.equal(channel.published.length, 1);
  assert.equal(channel.published[0]?.exchange, FLOWPILOT_EXCHANGES.retry);
  assert.equal(
    channel.published[0]?.routingKey,
    FLOWPILOT_RETRY_ROUTING_KEYS.workflowExecutionRequested10s
  );
  assert.equal(channel.published[0]?.options.headers["x-flowpilot-retry-attempt"], 1);
});

test("marks failed, publishes failed event, and dead-letters after max retries", async () => {
  const channel = createFakeChannel();
  const outboxRecord = createOutboxRecord(FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed);
  const prisma = {
    workflowExecution: {
      findUnique: async () => {
        throw new Error("permanent worker failure");
      },
      updateMany: async () => ({ count: 1 })
    },
    outboxMessage: {
      upsert: async () => outboxRecord,
      update: async () => ({
        ...outboxRecord,
        status: "PUBLISHED",
        attempts: 1,
        publishedAt: new Date("2026-05-02T12:00:01.000Z")
      })
    },
    $transaction: async <T>(callback: (tx: unknown) => Promise<T>) => {
      return callback(prisma);
    }
  } as unknown as PrismaClient;

  await handleDelivery(
    createConsumeMessage(validMessage(), {
      headers: {
        "x-flowpilot-retry-attempt": 3
      }
    }),
    channel,
    prisma
  );

  assert.equal(channel.acked, true);
  assert.equal(channel.nacked, false);
  assert.equal(channel.published.length, 2);
  assert.equal(channel.published[0]?.exchange, FLOWPILOT_EXCHANGES.events);
  assert.equal(channel.published[0]?.routingKey, FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed);
  assert.equal(channel.published[1]?.exchange, FLOWPILOT_EXCHANGES.dlx);
  assert.equal(channel.published[1]?.routingKey, FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested);

  const failedMessage = JSON.parse(channel.published[0]?.content.toString("utf8") ?? "{}") as {
    payload?: { error?: { retryable?: boolean } };
  };
  assert.equal(failedMessage.payload?.error?.retryable, true);
});

test("dispatches pending outbox messages and marks them as published", async () => {
  const channel = createFakeChannel();
  const outboxRecord = createOutboxRecord(FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted);
  const updates: unknown[] = [];
  const prisma = {
    outboxMessage: {
      findMany: async () => [outboxRecord],
      update: async (args: unknown) => {
        updates.push(args);
        return {
          ...outboxRecord,
          status: "PUBLISHED",
          attempts: 1,
          publishedAt: new Date("2026-05-02T12:00:02.000Z")
        };
      }
    }
  } as unknown as PrismaClient;

  const result = await dispatchPendingOutboxMessages(channel, prisma);

  assert.deepEqual(result, { failed: 0, fetched: 1, published: 1 });
  assert.equal(channel.published.length, 1);
  assert.equal(channel.published[0]?.exchange, FLOWPILOT_EXCHANGES.events);
  assert.equal(channel.published[0]?.routingKey, FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted);
  assert.equal(updates.length, 1);
});

test("records outbox publish failures without stopping the batch", async () => {
  const channel = createFakeChannel({ publishResults: [false, true] });
  const failedRecord = {
    ...createOutboxRecord(FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed),
    attempts: 4,
    id: "outbox-failed"
  };
  const publishedRecord = {
    ...createOutboxRecord(FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted),
    id: "outbox-published",
    idempotencyKey: "workflow.execution.completed:execution-1"
  };
  const updates: Array<{ data?: { status?: string } }> = [];
  const prisma = {
    outboxMessage: {
      findMany: async () => [failedRecord, publishedRecord],
      update: async (args: { data?: { status?: string } }) => {
        updates.push(args);
        return args;
      }
    }
  } as unknown as PrismaClient;

  const result = await dispatchPendingOutboxMessages(channel, prisma);

  assert.deepEqual(result, { failed: 1, fetched: 2, published: 1 });
  assert.equal(channel.published.length, 2);
  assert.equal(updates[0]?.data?.status, "FAILED");
  assert.equal(updates[1]?.data?.status, "PUBLISHED");
});

test("limits pending outbox dispatch batches", async () => {
  const channel = createFakeChannel();
  const findManyArgs: unknown[] = [];
  const prisma = {
    outboxMessage: {
      findMany: async (args: unknown) => {
        findManyArgs.push(args);
        return [];
      }
    }
  } as unknown as PrismaClient;

  const result = await dispatchPendingOutboxMessages(channel, prisma, 2);

  assert.deepEqual(result, { failed: 0, fetched: 0, published: 0 });
  assert.deepEqual(findManyArgs, [
    {
      orderBy: {
        createdAt: "asc"
      },
      take: 2,
      where: {
        attempts: {
          lt: 5
        },
        status: "PENDING"
      }
    }
  ]);
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

function createConsumeMessage(
  payload: unknown,
  options: { headers?: Record<string, unknown> } = {}
): ConsumeMessage {
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
      headers: options.headers ?? {},
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

type FakeChannel = Channel & {
  acked: boolean;
  nacked: boolean;
  published: Array<{
    exchange: string;
    routingKey: string;
    content: Buffer;
    options: { headers: Record<string, unknown> };
  }>;
};

function createFakeChannel(options: { publishResults?: boolean[] } = {}) {
  const channel = {
    acked: false,
    nacked: false,
    published: [] as Array<{
      exchange: string;
      routingKey: string;
      content: Buffer;
      options: { headers: Record<string, unknown> };
    }>,
    ack() {
      channel.acked = true;
    },
    nack() {
      channel.nacked = true;
    },
    publish(
      exchange: string,
      routingKey: string,
      content: Buffer,
      publishOptions: { headers?: Record<string, unknown> } = {}
    ) {
      channel.published.push({
        exchange,
        routingKey,
        content,
        options: {
          headers: publishOptions.headers ?? {}
        }
      });
      return options.publishResults?.shift() ?? true;
    }
  };

  return channel as unknown as FakeChannel;
}

function createOutboxRecord(routingKey: string) {
  const message = validMessage();
  const failedEvent = {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed,
    eventId: "failed-event-1",
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: "2026-05-02T12:00:01.000Z",
    workspaceId: message.workspaceId,
    correlationId: message.correlationId,
    causationId: message.eventId,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker,
    idempotencyKey: "workflow.execution.failed:execution-1",
    payload: {
      workflowId: message.payload.workflowId,
      executionId: message.payload.executionId,
      error: {
        code: "workflow_execution_worker_error",
        message: "permanent worker failure",
        retryable: true
      }
    }
  };

  return {
    id: "outbox-1",
    exchange: FLOWPILOT_EXCHANGES.events,
    routingKey,
    eventName: failedEvent.eventName,
    messageId: failedEvent.eventId,
    idempotencyKey: failedEvent.idempotencyKey,
    payload: failedEvent,
    headers: {
      correlationId: failedEvent.correlationId,
      producer: failedEvent.producer,
      schemaVersion: failedEvent.schemaVersion,
      workspaceId: failedEvent.workspaceId
    },
    status: "PENDING",
    attempts: 0,
    lastError: null,
    publishedAt: null,
    createdAt: new Date("2026-05-02T12:00:01.000Z"),
    updatedAt: new Date("2026-05-02T12:00:01.000Z")
  };
}
