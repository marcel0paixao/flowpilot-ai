import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkflowStatus } from "@prisma/client/index";

import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkflowDto } from "./dto/create-workflow.dto.js";

@Injectable()
export class WorkflowsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateWorkflowDto) {
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

      return toWorkflowResponse(workflow);
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
