import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { WorkspaceRoles } from "../auth/decorators/workspace-roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { WorkspaceRolesGuard } from "../auth/guards/workspace-roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/current-user.js";
import { AddWorkspaceMemberDto } from "./dto/add-workspace-member.dto.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { UpdateWorkspaceMemberDto } from "./dto/update-workspace-member.dto.js";
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

  @Get(":id/members")
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({ description: "Workspace members list." })
  findMembers(@Param("id") id: string) {
    return this.workspacesService.findMembers(id);
  }

  @Post(":id/members")
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiCreatedResponse({ description: "Workspace member added." })
  addMember(
    @Param("id") id: string,
    @Body() dto: AddWorkspaceMemberDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.workspacesService.addMember(id, user.sub, dto);
  }

  @Patch(":id/members/:memberId")
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOkResponse({ description: "Workspace member role updated." })
  updateMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, user.sub, dto.role);
  }

  @Delete(":id/members/:memberId")
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOkResponse({ description: "Workspace member removed." })
  removeMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.workspacesService.removeMember(id, memberId, user.sub);
  }
}
