import { readConfig } from "@flowpilot/config";
import {
  FLOWPILOT_DEAD_LETTER_QUEUES,
  FLOWPILOT_EXCHANGES,
  FLOWPILOT_MAX_RETRY_ATTEMPTS,
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_QUEUES,
  FLOWPILOT_RETRY_QUEUES,
  FLOWPILOT_RETRY_ROUTING_KEYS,
  FLOWPILOT_ROUTING_KEYS,
  type FlowPilotExecutionError,
  type WorkflowExecutionCompletedMessage,
  type WorkflowExecutionFailedMessage,
  type WorkflowExecutionRequestedMessage,
  type WorkflowExecutionStartedMessage
} from "@flowpilot/contracts";
import { createLogger } from "@flowpilot/logger";
import { Prisma, PrismaClient } from "@prisma/client/index";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const logger = createLogger("execution-worker", "debug");

const retryAttemptHeader = "x-flowpilot-retry-attempt";
const failureSimulationInputKey = "__flowpilotSimulateFailure";
const outboxDispatcherBatchSize = 25;
const outboxDispatcherIntervalMs = 5_000;
const outboxMaxPublishAttempts = 5;

const retryQueueConfig = [
  {
    queue: FLOWPILOT_RETRY_QUEUES.executionWorkerWorkflowExecutions10s,
    routingKey: FLOWPILOT_RETRY_ROUTING_KEYS.workflowExecutionRequested10s,
    ttlMs: 10_000
  },
  {
    queue: FLOWPILOT_RETRY_QUEUES.executionWorkerWorkflowExecutions1m,
    routingKey: FLOWPILOT_RETRY_ROUTING_KEYS.workflowExecutionRequested1m,
    ttlMs: 60_000
  },
  {
    queue: FLOWPILOT_RETRY_QUEUES.executionWorkerWorkflowExecutions5m,
    routingKey: FLOWPILOT_RETRY_ROUTING_KEYS.workflowExecutionRequested5m,
    ttlMs: 300_000
  }
] as const;

type WorkerResources = {
  channel: Channel;
  connection: ChannelModel;
  outboxDispatcher: ReturnType<typeof setInterval>;
  prisma: PrismaClient;
};

type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

type WorkerFailure = FlowPilotExecutionError & {
  cause?: unknown;
};

type WorkflowLifecycleRoutingKey =
  | typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted
  | typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted
  | typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed;

type WorkflowLifecycleMessage =
  | WorkflowExecutionStartedMessage
  | WorkflowExecutionCompletedMessage
  | WorkflowExecutionFailedMessage;

type PrismaWriter = PrismaClient | Prisma.TransactionClient;

export async function startWorker(): Promise<WorkerResources> {
  const config = readConfig();
  const prisma = new PrismaClient();
  const connection = await connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await declareTopology(channel);
  await channel.prefetch(1);

  await channel.consume(FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions, async (message) => {
    if (!message) {
      return;
    }

    await handleDelivery(message, channel, prisma);
  });

  const outboxDispatcher = startOutboxDispatcher(channel, prisma);

  logger.info("Execution worker started", {
    queue: FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions,
    routingKey: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
  });

  return {
    channel,
    connection,
    outboxDispatcher,
    prisma
  };
}

function startOutboxDispatcher(
  channel: Channel,
  prisma: PrismaClient
): ReturnType<typeof setInterval> {
  const dispatch = async () => {
    try {
      const result = await dispatchPendingOutboxMessages(channel, prisma);

      if (result.published > 0 || result.failed > 0) {
        logger.info("Outbox dispatch cycle completed", result);
      }
    } catch (error) {
      logger.error("Outbox dispatch cycle failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  void dispatch();

  const timer = setInterval(() => {
    void dispatch();
  }, outboxDispatcherIntervalMs);
  timer.unref();

  return timer;
}

export async function handleDelivery(
  message: ConsumeMessage,
  channel: Channel,
  prisma: PrismaClient
): Promise<void> {
  const parsedMessage = parseWorkflowExecutionRequestedMessage(message);

  if (!parsedMessage) {
    logger.warn("Rejecting invalid workflow execution request", {
      routingKey: message.fields.routingKey
    });
    await publishRawDeadLetter(channel, message, "invalid_payload");
    channel.ack(message);
    return;
  }

  try {
    await processWorkflowExecution(parsedMessage, channel, prisma);
    channel.ack(message);
  } catch (error) {
    const failure = normalizeWorkerFailure(error);
    const currentRetryAttempt = getWorkflowExecutionRetryAttempt(message);

    logger.error("Workflow execution processing failed", {
      error: failure.message,
      executionId: parsedMessage.payload.executionId
    });

    if (failure.retryable && currentRetryAttempt < FLOWPILOT_MAX_RETRY_ATTEMPTS) {
      await publishRetryCommand(channel, parsedMessage, currentRetryAttempt + 1);
      channel.ack(message);
      return;
    }

    try {
      await failWorkflowExecution(parsedMessage, channel, prisma, failure);
      await publishCommandDeadLetter(channel, parsedMessage, failure, currentRetryAttempt);
      channel.ack(message);
    } catch (terminalFailureError) {
      logger.error("Failed to persist terminal workflow execution failure", {
        error:
          terminalFailureError instanceof Error
            ? terminalFailureError.message
            : String(terminalFailureError),
        executionId: parsedMessage.payload.executionId
      });
      channel.nack(message, false, true);
    }
  }
}

export async function processWorkflowExecution(
  message: WorkflowExecutionRequestedMessage,
  channel: Channel,
  prisma: PrismaClient
): Promise<void> {
  const startedAt = new Date();
  const existingExecution = await prisma.workflowExecution.findUnique({
    where: {
      id: message.payload.executionId
    }
  });

  if (!existingExecution) {
    throw new WorkflowExecutionWorkerError("workflow_execution_not_found", "Workflow execution was not found", false);
  }

  if (isTerminalExecutionStatus(existingExecution.status)) {
    logger.info("Skipping workflow execution because it is already terminal", {
      executionId: existingExecution.id,
      status: existingExecution.status
    });
    await dispatchPendingWorkflowExecutionOutboxMessages(channel, prisma, existingExecution.id);
    return;
  }

  let execution = existingExecution;
  const effectiveStartedAt = existingExecution.startedAt ?? startedAt;

  if (existingExecution.status === "PENDING") {
    const startedMessage = createWorkflowExecutionStartedMessage(
      message,
      effectiveStartedAt.toISOString()
    );
    const transition = await prisma.$transaction(async (tx) => {
      const update = await tx.workflowExecution.updateMany({
        where: {
          id: message.payload.executionId,
          status: "PENDING"
        },
        data: {
          status: "RUNNING",
          startedAt: effectiveStartedAt
        }
      });

      if (update.count === 0) {
        return {
          update
        };
      }

      const outboxMessage = await persistOutboxEvent(
        tx,
        FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted,
        startedMessage
      );

      return {
        update,
        outboxMessage
      };
    });

    if (transition.update.count === 0) {
      const currentExecution = await prisma.workflowExecution.findUnique({
        where: {
          id: message.payload.executionId
        }
      });

      if (!currentExecution || isTerminalExecutionStatus(currentExecution.status)) {
        logger.info("Skipping workflow execution after concurrent state transition", {
          executionId: message.payload.executionId,
          status: currentExecution?.status ?? "MISSING"
        });
        await dispatchPendingWorkflowExecutionOutboxMessages(
          channel,
          prisma,
          message.payload.executionId
        );
        return;
      }

      execution = currentExecution;
    } else {
      execution = {
        ...existingExecution,
        status: "RUNNING",
        startedAt: effectiveStartedAt
      };
      if (!transition.outboxMessage) {
        throw new WorkflowExecutionWorkerError(
          "workflow_execution_started_outbox_missing",
          "Workflow execution started outbox message was not created",
          true
        );
      }
      await dispatchOutboxEvent(channel, prisma, transition.outboxMessage);
    }
  } else {
    const startedOutboxMessage = await persistOutboxEvent(
      prisma,
      FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted,
      createWorkflowExecutionStartedMessage(message, effectiveStartedAt.toISOString())
    );
    await dispatchOutboxEvent(channel, prisma, startedOutboxMessage);
  }

  const output = createExecutionOutput(message);
  const completedAt = new Date();
  const completedMessage = createWorkflowExecutionCompletedMessage(
    message,
    output,
    effectiveStartedAt,
    completedAt
  );
  const completion = await prisma.$transaction(async (tx) => {
    const update = await tx.workflowExecution.updateMany({
      where: {
        id: execution.id,
        status: "RUNNING"
      },
      data: {
        status: "SUCCEEDED",
        output: output as Prisma.InputJsonObject,
        completedAt
      }
    });

    if (update.count === 0) {
      return {
        update
      };
    }

    const outboxMessage = await persistOutboxEvent(
      tx,
      FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted,
      completedMessage
    );

    return {
      update,
      outboxMessage
    };
  });

  if (completion.update.count === 0) {
    const currentExecution = await prisma.workflowExecution.findUnique({
      where: {
        id: execution.id
      }
    });

    if (currentExecution && isTerminalExecutionStatus(currentExecution.status)) {
      logger.info("Skipping completion event because workflow execution is already terminal", {
        executionId: execution.id,
        status: currentExecution.status
      });
      await dispatchPendingWorkflowExecutionOutboxMessages(channel, prisma, execution.id);
      return;
    }

    throw new WorkflowExecutionWorkerError(
      "workflow_execution_completion_conflict",
      "Workflow execution could not be completed from RUNNING state",
      true
    );
  }

  if (!completion.outboxMessage) {
    throw new WorkflowExecutionWorkerError(
      "workflow_execution_completed_outbox_missing",
      "Workflow execution completed outbox message was not created",
      true
    );
  }

  await dispatchOutboxEvent(channel, prisma, completion.outboxMessage);

  logger.info("Workflow execution completed", {
    executionId: execution.id,
    workflowId: execution.workflowId,
    workspaceId: execution.workspaceId
  });
}

export function parseWorkflowExecutionRequestedMessage(
  message: ConsumeMessage
): WorkflowExecutionRequestedMessage | null {
  let payload: unknown;

  try {
    payload = JSON.parse(message.content.toString("utf8"));
  } catch {
    return null;
  }

  if (!isWorkflowExecutionRequestedMessage(payload)) {
    return null;
  }

  return payload;
}

function isWorkflowExecutionRequestedMessage(
  value: unknown
): value is WorkflowExecutionRequestedMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.eventName !== FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested ||
    typeof value.eventId !== "string" ||
    value.schemaVersion !== FLOWPILOT_MESSAGE_SCHEMA_VERSION ||
    typeof value.occurredAt !== "string" ||
    typeof value.workspaceId !== "string" ||
    typeof value.correlationId !== "string" ||
    value.producer !== FLOWPILOT_MESSAGE_PRODUCERS.api ||
    !isRecord(value.payload)
  ) {
    return false;
  }

  const payload = value.payload;

  return (
    typeof payload.workflowId === "string" &&
    typeof payload.workflowVersion === "number" &&
    typeof payload.executionId === "string" &&
    isRecord(payload.requestedBy) &&
    payload.requestedBy.type === "user" &&
    typeof payload.requestedBy.id === "string" &&
    isRecord(payload.input)
  );
}

function createWorkflowExecutionStartedMessage(
  message: WorkflowExecutionRequestedMessage,
  occurredAt: string
): WorkflowExecutionStartedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted,
    eventId: randomUUID(),
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt,
    workspaceId: message.workspaceId,
    correlationId: message.correlationId,
    causationId: message.eventId,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker,
    actor: {
      type: "system",
      id: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker
    },
    idempotencyKey: `workflow.execution.started:${message.payload.executionId}`,
    payload: {
      workflowId: message.payload.workflowId,
      executionId: message.payload.executionId
    }
  };
}

function createWorkflowExecutionCompletedMessage(
  message: WorkflowExecutionRequestedMessage,
  output: Record<string, unknown>,
  startedAt: Date,
  completedAt: Date
): WorkflowExecutionCompletedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted,
    eventId: randomUUID(),
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: completedAt.toISOString(),
    workspaceId: message.workspaceId,
    correlationId: message.correlationId,
    causationId: message.eventId,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker,
    actor: {
      type: "system",
      id: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker
    },
    idempotencyKey: `workflow.execution.completed:${message.payload.executionId}`,
    payload: {
      workflowId: message.payload.workflowId,
      executionId: message.payload.executionId,
      output,
      durationMs: completedAt.getTime() - startedAt.getTime()
    }
  };
}

function createWorkflowExecutionFailedMessage(
  message: WorkflowExecutionRequestedMessage,
  error: FlowPilotExecutionError,
  occurredAt: Date
): WorkflowExecutionFailedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed,
    eventId: randomUUID(),
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: occurredAt.toISOString(),
    workspaceId: message.workspaceId,
    correlationId: message.correlationId,
    causationId: message.eventId,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker,
    actor: {
      type: "system",
      id: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker
    },
    idempotencyKey: `workflow.execution.failed:${message.payload.executionId}`,
    payload: {
      workflowId: message.payload.workflowId,
      executionId: message.payload.executionId,
      error
    }
  };
}

function createExecutionOutput(message: WorkflowExecutionRequestedMessage): Record<string, unknown> {
  const simulatedFailure = message.payload.input[failureSimulationInputKey];

  if (process.env.FLOWPILOT_ENABLE_WORKER_FAILURE_SIMULATION === "true") {
    if (simulatedFailure === "retryable") {
      throw new WorkflowExecutionWorkerError(
        "workflow_execution_simulated_retryable_failure",
        "Simulated retryable workflow execution failure",
        true
      );
    }

    if (simulatedFailure === "non_retryable") {
      throw new WorkflowExecutionWorkerError(
        "workflow_execution_simulated_non_retryable_failure",
        "Simulated non-retryable workflow execution failure",
        false
      );
    }
  }

  return {
    status: "ok",
    echoedInput: message.payload.input,
    processedBy: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker
  };
}

async function failWorkflowExecution(
  message: WorkflowExecutionRequestedMessage,
  channel: Channel,
  prisma: PrismaClient,
  failure: FlowPilotExecutionError
): Promise<void> {
  const failedAt = new Date();
  const failureRecord = {
    code: failure.code,
    message: failure.message,
    retryable: failure.retryable
  };
  const failedMessage = createWorkflowExecutionFailedMessage(message, failureRecord, failedAt);

  const update = await prisma.$transaction(async (tx) => {
    const statusUpdate = await tx.workflowExecution.updateMany({
      where: {
        id: message.payload.executionId,
        status: {
          in: ["PENDING", "RUNNING"]
        }
      },
      data: {
        status: "FAILED",
        error: failureRecord as Prisma.InputJsonObject,
        completedAt: failedAt
      }
    });

    if (statusUpdate.count === 0) {
      return {
        statusUpdate
      };
    }

    const outboxMessage = await persistOutboxEvent(
      tx,
      FLOWPILOT_ROUTING_KEYS.workflowExecutionFailed,
      failedMessage
    );

    return {
      statusUpdate,
      outboxMessage
    };
  });

  if (update.statusUpdate.count === 0) {
    const execution = await prisma.workflowExecution.findUnique({
      where: {
        id: message.payload.executionId
      }
    });

    if (execution && isTerminalExecutionStatus(execution.status)) {
      logger.info("Skipping failed event because workflow execution is already terminal", {
        executionId: execution.id,
        status: execution.status
      });
      await dispatchPendingWorkflowExecutionOutboxMessages(channel, prisma, execution.id);
      return;
    }

    throw new WorkflowExecutionWorkerError(
      "workflow_execution_failure_conflict",
      "Workflow execution could not be failed from PENDING or RUNNING state",
      true
    );
  }

  if (!update.outboxMessage) {
    throw new WorkflowExecutionWorkerError(
      "workflow_execution_failed_outbox_missing",
      "Workflow execution failed outbox message was not created",
      true
    );
  }

  await dispatchOutboxEvent(channel, prisma, update.outboxMessage);
}

async function persistOutboxEvent(
  prisma: PrismaWriter,
  routingKey: WorkflowLifecycleRoutingKey,
  message: WorkflowLifecycleMessage
) {
  const idempotencyKey = message.idempotencyKey ?? message.eventId;
  const headers = createOutboxHeaders(message);

  return prisma.outboxMessage.upsert({
    where: {
      idempotencyKey
    },
    update: {},
    create: {
      exchange: FLOWPILOT_EXCHANGES.events,
      routingKey,
      eventName: message.eventName,
      messageId: message.eventId,
      idempotencyKey,
      payload: message as unknown as Prisma.InputJsonObject,
      headers: headers as Prisma.InputJsonObject
    }
  });
}

async function dispatchOutboxEvent(
  channel: Channel,
  prisma: PrismaClient,
  outboxMessage: Awaited<ReturnType<typeof persistOutboxEvent>>
): Promise<void> {
  if (outboxMessage.status === "PUBLISHED") {
    return;
  }

  const headers = isRecord(outboxMessage.headers) ? outboxMessage.headers : {};
  let published: boolean;

  try {
    published = channel.publish(
      outboxMessage.exchange,
      outboxMessage.routingKey,
      Buffer.from(JSON.stringify(outboxMessage.payload)),
      {
        contentType: "application/json",
        deliveryMode: 2,
        messageId: outboxMessage.messageId,
        timestamp: Math.floor(Date.now() / 1000),
        type: outboxMessage.eventName,
        headers
      }
    );
  } catch (error) {
    const publishError = error instanceof Error ? error : new Error(String(error));
    await markOutboxPublishFailure(prisma, outboxMessage, publishError);
    throw publishError;
  }

  if (!published) {
    const error = new Error("RabbitMQ channel backpressure while publishing outbox message");
    await markOutboxPublishFailure(prisma, outboxMessage, error);
    throw error;
  }

  await prisma.outboxMessage.update({
    where: {
      id: outboxMessage.id
    },
    data: {
      status: "PUBLISHED",
      attempts: {
        increment: 1
      },
      lastError: null,
      publishedAt: new Date()
    }
  });
}

export async function dispatchPendingOutboxMessages(
  channel: Channel,
  prisma: PrismaClient,
  batchSize = outboxDispatcherBatchSize
): Promise<{ fetched: number; failed: number; published: number }> {
  const pendingMessages = await prisma.outboxMessage.findMany({
    where: {
      status: "PENDING",
      attempts: {
        lt: outboxMaxPublishAttempts
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: batchSize
  });

  let failed = 0;
  let published = 0;

  for (const pendingMessage of pendingMessages) {
    try {
      await dispatchOutboxEvent(channel, prisma, pendingMessage);
      published += 1;
    } catch (error) {
      failed += 1;
      logger.error("Outbox message publish failed", {
        error: error instanceof Error ? error.message : String(error),
        eventName: pendingMessage.eventName,
        id: pendingMessage.id,
        routingKey: pendingMessage.routingKey
      });
    }
  }

  return {
    fetched: pendingMessages.length,
    failed,
    published
  };
}

async function dispatchPendingWorkflowExecutionOutboxMessages(
  channel: Channel,
  prisma: PrismaClient,
  executionId: string
): Promise<void> {
  const pendingMessages = await prisma.outboxMessage.findMany({
    where: {
      status: "PENDING",
      idempotencyKey: {
        in: [
          `workflow.execution.started:${executionId}`,
          `workflow.execution.completed:${executionId}`,
          `workflow.execution.failed:${executionId}`
        ]
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  for (const pendingMessage of pendingMessages) {
    await dispatchOutboxEvent(channel, prisma, pendingMessage);
  }
}

async function markOutboxPublishFailure(
  prisma: PrismaClient,
  outboxMessage: Awaited<ReturnType<typeof persistOutboxEvent>>,
  error: Error
): Promise<void> {
  const attempts = outboxMessage.attempts + 1;
  await prisma.outboxMessage.update({
    where: {
      id: outboxMessage.id
    },
    data: {
      attempts,
      lastError: error.message,
      status: attempts >= outboxMaxPublishAttempts ? "FAILED" : outboxMessage.status
    }
  });
}

function createOutboxHeaders(message: WorkflowLifecycleMessage): Record<string, unknown> {
  return {
    correlationId: message.correlationId,
    producer: message.producer,
    schemaVersion: message.schemaVersion,
    workspaceId: message.workspaceId
  };
}

async function publishRetryCommand(
  channel: Channel,
  message: WorkflowExecutionRequestedMessage,
  retryAttempt: number
): Promise<void> {
  const retryConfig = retryQueueConfig[retryAttempt - 1];

  if (!retryConfig) {
    throw new WorkflowExecutionWorkerError(
      "workflow_execution_retry_policy_missing",
      `No retry queue configured for attempt ${retryAttempt}`,
      false
    );
  }

  channel.publish(
    FLOWPILOT_EXCHANGES.retry,
    retryConfig.routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      contentType: "application/json",
      deliveryMode: 2,
      messageId: message.eventId,
      timestamp: Math.floor(Date.parse(message.occurredAt) / 1000),
      type: message.eventName,
      headers: {
        correlationId: message.correlationId,
        producer: message.producer,
        schemaVersion: message.schemaVersion,
        workspaceId: message.workspaceId,
        [retryAttemptHeader]: retryAttempt
      }
    }
  );

  logger.info("Workflow execution retry scheduled", {
    executionId: message.payload.executionId,
    retryAttempt,
    retryQueue: retryConfig.queue
  });
}

async function publishCommandDeadLetter(
  channel: Channel,
  message: WorkflowExecutionRequestedMessage,
  failure: FlowPilotExecutionError,
  retryAttempt: number
): Promise<void> {
  channel.publish(
    FLOWPILOT_EXCHANGES.dlx,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
    Buffer.from(JSON.stringify(message)),
    {
      contentType: "application/json",
      deliveryMode: 2,
      messageId: message.eventId,
      timestamp: Math.floor(Date.parse(message.occurredAt) / 1000),
      type: message.eventName,
      headers: {
        correlationId: message.correlationId,
        producer: message.producer,
        schemaVersion: message.schemaVersion,
        workspaceId: message.workspaceId,
        [retryAttemptHeader]: retryAttempt,
        "x-flowpilot-dead-letter-code": failure.code,
        "x-flowpilot-dead-letter-reason": failure.message
      }
    }
  );
}

async function publishRawDeadLetter(
  channel: Channel,
  message: ConsumeMessage,
  reason: string
): Promise<void> {
  channel.publish(FLOWPILOT_EXCHANGES.dlx, message.fields.routingKey, message.content, {
    contentType: message.properties.contentType,
    deliveryMode: 2,
    messageId: message.properties.messageId,
    timestamp: Math.floor(Date.now() / 1000),
    type: message.properties.type,
    headers: {
      ...message.properties.headers,
      "x-flowpilot-dead-letter-reason": reason
    }
  });
}

async function declareTopology(channel: Channel): Promise<void> {
  await Promise.all([
    channel.assertExchange(FLOWPILOT_EXCHANGES.commands, "topic", { durable: true }),
    channel.assertExchange(FLOWPILOT_EXCHANGES.events, "topic", { durable: true }),
    channel.assertExchange(FLOWPILOT_EXCHANGES.retry, "topic", { durable: true }),
    channel.assertExchange(FLOWPILOT_EXCHANGES.dlx, "topic", { durable: true })
  ]);

  await channel.assertQueue(FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions, {
    durable: true
  });

  await channel.assertQueue(FLOWPILOT_DEAD_LETTER_QUEUES.executionWorkerWorkflowExecutions, {
    durable: true
  });

  await channel.bindQueue(
    FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions,
    FLOWPILOT_EXCHANGES.commands,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
  );

  await channel.bindQueue(
    FLOWPILOT_DEAD_LETTER_QUEUES.executionWorkerWorkflowExecutions,
    FLOWPILOT_EXCHANGES.dlx,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
  );

  for (const retryConfig of retryQueueConfig) {
    await channel.assertQueue(retryConfig.queue, {
      durable: true,
      arguments: {
        "x-message-ttl": retryConfig.ttlMs,
        "x-dead-letter-exchange": FLOWPILOT_EXCHANGES.commands,
        "x-dead-letter-routing-key": FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
      }
    });
    await channel.bindQueue(retryConfig.queue, FLOWPILOT_EXCHANGES.retry, retryConfig.routingKey);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getWorkflowExecutionRetryAttempt(message: ConsumeMessage): number {
  const retryAttempt = message.properties.headers?.[retryAttemptHeader];

  if (typeof retryAttempt === "number" && Number.isInteger(retryAttempt) && retryAttempt >= 0) {
    return retryAttempt;
  }

  if (typeof retryAttempt === "string") {
    const parsedRetryAttempt = Number.parseInt(retryAttempt, 10);

    if (Number.isInteger(parsedRetryAttempt) && parsedRetryAttempt >= 0) {
      return parsedRetryAttempt;
    }
  }

  return 0;
}

function isTerminalExecutionStatus(status: string): status is Extract<
  ExecutionStatus,
  "SUCCEEDED" | "FAILED" | "CANCELLED"
> {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
}

function normalizeWorkerFailure(error: unknown): WorkerFailure {
  if (error instanceof WorkflowExecutionWorkerError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      cause: error.cause
    };
  }

  return {
    code: "workflow_execution_worker_error",
    message: error instanceof Error ? error.message : String(error),
    retryable: true,
    cause: error
  };
}

class WorkflowExecutionWorkerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "WorkflowExecutionWorkerError";
  }
}

async function shutdown(resources: WorkerResources): Promise<void> {
  logger.info("Stopping execution worker");
  clearInterval(resources.outboxDispatcher);
  await resources.channel.close();
  await resources.connection.close();
  await resources.prisma.$disconnect();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const resources = await startWorker();

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown(resources).finally(() => {
        process.exit(0);
      });
    });
  }
}
