import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client/index";
import {
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowCreatedMessage,
  type WorkflowExecutionRequestedMessage
} from "@flowpilot/contracts";
import { randomUUID } from "node:crypto";

import type { MessagePublisher } from "../messaging/message-publisher.js";
import { MESSAGE_PUBLISHER } from "../messaging/messaging.tokens.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkflowExecutionDto } from "./dto/create-workflow-execution.dto.js";
import { CreateWorkflowDto } from "./dto/create-workflow.dto.js";

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagingService: MessagePublisher
  ) {}

  async create(workspaceId: string, dto: CreateWorkflowDto, actorUserId: string) {
    try {
      const workflow = await this.prisma.workflow.create({
        data: {
          workspaceId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          status: "DRAFT",
          versions: {
            create: {
              version: 1,
              definition: this.getInitialDefinition(dto.definition)
            }
          }
        },
        include: workflowWithCurrentVersion
      });

      const response = toWorkflowResponse(workflow);

      await this.messagingService.publishEvent(
        FLOWPILOT_ROUTING_KEYS.workflowCreated,
        createWorkflowCreatedMessage(response, actorUserId)
      );

      return response;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Workflow slug already exists in this workspace");
      }

      throw error;
    }
  }

  async findAllForWorkspace(workspaceId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        workspaceId
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: workflowWithCurrentVersion
    });

    return workflows.map(toWorkflowResponse);
  }

  async findOne(workspaceId: string, workflowId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        workspaceId
      },
      include: workflowWithCurrentVersion
    });

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    return toWorkflowResponse(workflow);
  }

  async requestExecution(
    workspaceId: string,
    workflowId: string,
    dto: CreateWorkflowExecutionDto,
    actorUserId: string
  ) {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        workspaceId
      },
      include: workflowWithCurrentVersion
    });

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    const currentVersion = workflow.versions[0];

    if (!currentVersion) {
      throw new NotFoundException("Workflow version not found");
    }

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workspaceId,
        workflowId,
        workflowVersionId: currentVersion.id,
        requestedByUserId: actorUserId,
        status: "PENDING",
        input: this.getExecutionInput(dto.input)
      }
    });

    const response = toWorkflowExecutionResponse(execution);

    await this.messagingService.publishEvent(
      FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
      createWorkflowExecutionRequestedMessage(response, currentVersion.version, actorUserId)
    );

    return response;
  }

  async findExecutions(workspaceId: string, workflowId: string) {
    await this.ensureWorkflowExists(workspaceId, workflowId);

    const executions = await this.prisma.workflowExecution.findMany({
      where: {
        workspaceId,
        workflowId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return executions.map(toWorkflowExecutionResponse);
  }

  async findExecution(workspaceId: string, workflowId: string, executionId: string) {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        workspaceId,
        workflowId
      }
    });

    if (!execution) {
      throw new NotFoundException("Workflow execution not found");
    }

    return toWorkflowExecutionResponse(execution);
  }

  private getInitialDefinition(definition?: Record<string, unknown>): Prisma.InputJsonValue {
    return (definition ?? { nodes: [], edges: [] }) as Prisma.InputJsonObject;
  }

  private getExecutionInput(input?: Record<string, unknown>): Prisma.InputJsonValue {
    return (input ?? {}) as Prisma.InputJsonObject;
  }

  private async ensureWorkflowExists(workspaceId: string, workflowId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        workspaceId
      },
      select: {
        id: true
      }
    });

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }
  }
}

function createWorkflowCreatedMessage(
  workflow: ReturnType<typeof toWorkflowResponse>,
  actorUserId: string
): WorkflowCreatedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowCreated,
    eventId: randomUUID(),
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: new Date().toISOString(),
    workspaceId: workflow.workspaceId,
    correlationId: `workflow:${workflow.id}`,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.api,
    actor: {
      type: "user",
      id: actorUserId
    },
    idempotencyKey: `workflow.created:${workflow.id}`,
    payload: {
      workflowId: workflow.id,
      workflowVersionId: workflow.currentVersion.id,
      version: workflow.currentVersion.version,
      name: workflow.name,
      slug: workflow.slug,
      status: workflow.status
    }
  };
}

function createWorkflowExecutionRequestedMessage(
  execution: ReturnType<typeof toWorkflowExecutionResponse>,
  workflowVersion: number,
  actorUserId: string
): WorkflowExecutionRequestedMessage {
  return {
    eventName: FLOWPILOT_ROUTING_KEYS.workflowExecutionRequested,
    eventId: randomUUID(),
    schemaVersion: FLOWPILOT_MESSAGE_SCHEMA_VERSION,
    occurredAt: new Date().toISOString(),
    workspaceId: execution.workspaceId,
    correlationId: `workflow-execution:${execution.id}`,
    producer: FLOWPILOT_MESSAGE_PRODUCERS.api,
    actor: {
      type: "user",
      id: actorUserId
    },
    idempotencyKey: `workflow.execution.requested:${execution.id}`,
    payload: {
      workflowId: execution.workflowId,
      workflowVersion,
      executionId: execution.id,
      requestedBy: {
        type: "user",
        id: actorUserId
      },
      input: execution.input as Record<string, unknown>
    }
  };
}

const workflowWithCurrentVersion = {
  versions: {
    orderBy: {
      version: "desc"
    },
    take: 1
  }
} satisfies Prisma.WorkflowInclude;

type WorkflowWithCurrentVersion = Prisma.WorkflowGetPayload<{
  include: typeof workflowWithCurrentVersion;
}>;

type WorkflowExecution = Prisma.WorkflowExecutionGetPayload<Record<string, never>>;

function toWorkflowResponse(workflow: WorkflowWithCurrentVersion) {
  const currentVersion = workflow.versions[0];

  if (!currentVersion) {
    throw new NotFoundException("Workflow version not found");
  }

  return {
    id: workflow.id,
    workspaceId: workflow.workspaceId,
    name: workflow.name,
    slug: workflow.slug,
    description: workflow.description,
    status: workflow.status,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    currentVersion: {
      id: currentVersion.id,
      version: currentVersion.version,
      definition: currentVersion.definition,
      createdAt: currentVersion.createdAt,
      updatedAt: currentVersion.updatedAt
    }
  };
}

function toWorkflowExecutionResponse(execution: WorkflowExecution) {
  return {
    id: execution.id,
    workspaceId: execution.workspaceId,
    workflowId: execution.workflowId,
    workflowVersionId: execution.workflowVersionId,
    requestedByUserId: execution.requestedByUserId,
    status: execution.status,
    input: execution.input,
    output: execution.output,
    error: execution.error,
    startedAt: execution.startedAt,
    completedAt: execution.completedAt,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt
  };
}
