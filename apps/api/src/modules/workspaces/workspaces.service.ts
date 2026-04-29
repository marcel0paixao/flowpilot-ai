import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkspaceRole } from "@prisma/client/index";

import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";

@Injectable()
export class WorkspacesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto, ownerUserId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            members: {
              create: {
                userId: ownerUserId,
                role: WorkspaceRole.OWNER
              }
            }
          },
          include: workspaceInclude
        });

        return workspace;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Workspace slug already exists");
      }

      throw error;
    }
  }

  findAllForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: workspaceInclude
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: workspaceInclude
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    return workspace;
  }
}

const workspaceInclude = {
  members: {
    select: {
      id: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.WorkspaceInclude;
