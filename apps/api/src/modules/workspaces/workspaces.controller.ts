import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { WorkspaceRoles } from "../auth/decorators/workspace-roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { WorkspaceRolesGuard } from "../auth/guards/workspace-roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/current-user.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { WorkspacesService } from "./workspaces.service.js";

@ApiTags("workspaces")
@Controller("workspaces")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(@Inject(WorkspacesService) private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiCreatedResponse({ description: "Workspace created with an initial owner membership." })
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.create(dto, user.sub);
  }

  @Get()
  @ApiOkResponse({ description: "Workspace list." })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findAllForUser(user.sub);
  }

  @Get(":id")
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({ description: "Workspace details." })
  findOne(@Param("id") id: string) {
    return this.workspacesService.findOne(id);
  }
}
