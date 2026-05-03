import { readConfig } from "@flowpilot/config";
import {
  FLOWPILOT_EXCHANGES,
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_QUEUES,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowExecutionCompletedMessage,
  type WorkflowExecutionRequestedMessage,
  type WorkflowExecutionStartedMessage
} from "@flowpilot/contracts";
import { createLogger } from "@flowpilot/logger";
import { Prisma, PrismaClient } from "@prisma/client/index";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const logger = createLogger("execution-worker", "debug");

type WorkerResources = {
  channel: Channel;
  connection: ChannelModel;
  prisma: PrismaClient;
};

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

  logger.info("Execution worker started", {
    queue: FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions,
    routingKey: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
  });

  return {
    channel,
    connection,
    prisma
  };
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
    channel.nack(message, false, false);
    return;
  }

  try {
    await processWorkflowExecution(parsedMessage, channel, prisma);
    channel.ack(message);
  } catch (error) {
    logger.error("Workflow execution processing failed", {
      error: error instanceof Error ? error.message : String(error),
      executionId: parsedMessage.payload.executionId
    });
    channel.nack(message, false, true);
  }
}

export async function processWorkflowExecution(
  message: WorkflowExecutionRequestedMessage,
  channel: Channel,
  prisma: PrismaClient
): Promise<void> {
  const startedAt = new Date();
  const execution = await prisma.workflowExecution.update({
    where: {
      id: message.payload.executionId
    },
    data: {
      status: "RUNNING",
      startedAt
    }
  });

  await publishEvent(
    channel,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted,
    createWorkflowExecutionStartedMessage(message, startedAt.toISOString())
  );

  const output = createExecutionOutput(message);
  const completedAt = new Date();
  await prisma.workflowExecution.update({
    where: {
      id: execution.id
    },
    data: {
      status: "SUCCEEDED",
      output: output as Prisma.InputJsonObject,
      completedAt
    }
  });

  await publishEvent(
    channel,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted,
    createWorkflowExecutionCompletedMessage(message, output, startedAt, completedAt)
  );

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

function createExecutionOutput(message: WorkflowExecutionRequestedMessage): Record<string, unknown> {
  return {
    status: "ok",
    echoedInput: message.payload.input,
    processedBy: FLOWPILOT_MESSAGE_PRODUCERS.executionWorker
  };
}

async function publishEvent(
  channel: Channel,
  routingKey:
    | typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionStarted
    | typeof FLOWPILOT_ROUTING_KEYS.workflowExecutionCompleted,
  message: WorkflowExecutionStartedMessage | WorkflowExecutionCompletedMessage
): Promise<void> {
  channel.publish(FLOWPILOT_EXCHANGES.events, routingKey, Buffer.from(JSON.stringify(message)), {
    contentType: "application/json",
    deliveryMode: 2,
    messageId: message.eventId,
    timestamp: Math.floor(Date.parse(message.occurredAt) / 1000),
    type: message.eventName,
    headers: {
      correlationId: message.correlationId,
      producer: message.producer,
      schemaVersion: message.schemaVersion,
      workspaceId: message.workspaceId
    }
  });
}

async function declareTopology(channel: Channel): Promise<void> {
  await Promise.all([
    channel.assertExchange(FLOWPILOT_EXCHANGES.commands, "topic", { durable: true }),
    channel.assertExchange(FLOWPILOT_EXCHANGES.events, "topic", { durable: true })
  ]);

  await channel.assertQueue(FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions, {
    durable: true
  });
  await channel.bindQueue(
    FLOWPILOT_QUEUES.executionWorkerWorkflowExecutions,
    FLOWPILOT_EXCHANGES.commands,
    FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function shutdown(resources: WorkerResources): Promise<void> {
  logger.info("Stopping execution worker");
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
