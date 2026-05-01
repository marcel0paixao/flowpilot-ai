import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

import { WorkspaceRoles } from "../auth/decorators/workspace-roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { WorkspaceRolesGuard } from "../auth/guards/workspace-roles.guard.js";
import { CreateWorkflowDto } from "./dto/create-workflow.dto.js";
import { WorkflowResponseDto } from "./dto/workflow-response.dto.js";
import { WorkflowsService } from "./workflows.service.js";

@ApiTags("workflows")
@Controller("workspaces/:workspaceId/workflows")
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(@Inject(WorkflowsService) private readonly workflowsService: WorkflowsService) {}

  @Post()
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER)
  @ApiCreatedResponse({
    description: "Workflow created with an initial draft version.",
    type: WorkflowResponseDto
  })
  create(@Param("workspaceId") workspaceId: string, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(workspaceId, dto);
  }

  @Get()
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workspace workflow list.",
    type: WorkflowResponseDto,
    isArray: true
  })
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.workflowsService.findAllForWorkspace(workspaceId);
  }

  @Get(":workflowId")
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workflow details.",
    type: WorkflowResponseDto
  })
  findOne(@Param("workspaceId") workspaceId: string, @Param("workflowId") workflowId: string) {
    return this.workflowsService.findOne(workspaceId, workflowId);
  }
}
