import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkflowStatus } from "@prisma/client/index";
import {
  FLOWPILOT_MESSAGE_PRODUCERS,
  FLOWPILOT_MESSAGE_SCHEMA_VERSION,
  FLOWPILOT_ROUTING_KEYS,
  type WorkflowCreatedMessage
} from "@flowpilot/contracts";
import { randomUUID } from "node:crypto";

import { MessagingService } from "../messaging/messaging.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkflowDto } from "./dto/create-workflow.dto.js";

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MessagingService) private readonly messagingService: Pick<MessagingService, "publishEvent">
  ) {}

  async create(workspaceId: string, dto: CreateWorkflowDto, actorUserId: string) {
    try {
      const workflow = await this.prisma.workflow.create({
        data: {
          workspaceId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          status: WorkflowStatus.DRAFT,
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

  private getInitialDefinition(definition?: Record<string, unknown>): Prisma.InputJsonValue {
    return (definition ?? { nodes: [], edges: [] }) as Prisma.InputJsonObject;
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
