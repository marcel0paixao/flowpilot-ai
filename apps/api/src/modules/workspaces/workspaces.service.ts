import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkspaceRole } from "@prisma/client/index";

import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";

@Injectable()
export class WorkspacesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { email: dto.ownerEmail.toLowerCase() },
          create: {
            email: dto.ownerEmail.toLowerCase(),
            displayName: dto.ownerDisplayName
          },
          update: {
            displayName: dto.ownerDisplayName
          }
        });

        const workspace = await tx.workspace.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            members: {
              create: {
                userId: user.id,
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
        throw new ConflictException("Workspace slug or owner email already exists");
      }

      throw error;
    }
  }

  findAll() {
    return this.prisma.workspace.findMany({
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
    include: {
      user: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.WorkspaceInclude;
