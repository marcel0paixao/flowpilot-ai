import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { WorkspaceRoles } from "../auth/decorators/workspace-roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { WorkspaceRolesGuard } from "../auth/guards/workspace-roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/current-user.js";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe.js";
import {
  CreateWorkflowExecutionDto,
  createWorkflowExecutionSchema
} from "./dto/create-workflow-execution.dto.js";
import { CreateWorkflowDto, createWorkflowSchema } from "./dto/create-workflow.dto.js";
import { WorkflowExecutionEventResponseDto } from "./dto/workflow-execution-event-response.dto.js";
import { WorkflowExecutionResponseDto } from "./dto/workflow-execution-response.dto.js";
import { WorkflowNodeExecutionResponseDto } from "./dto/workflow-node-execution-response.dto.js";
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
  create(
    @Param("workspaceId") workspaceId: string,
    @Body(new ZodValidationPipe(createWorkflowSchema)) dto: CreateWorkflowDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.workflowsService.create(workspaceId, dto, user.sub);
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

  @Get(":workflowId/executions")
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workflow execution list.",
    type: WorkflowExecutionResponseDto,
    isArray: true
  })
  findExecutions(@Param("workspaceId") workspaceId: string, @Param("workflowId") workflowId: string) {
    return this.workflowsService.findExecutions(workspaceId, workflowId);
  }

  @Get(":workflowId/executions/:executionId/events")
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workflow execution timeline events.",
    type: WorkflowExecutionEventResponseDto,
    isArray: true
  })
  findExecutionEvents(
    @Param("workspaceId") workspaceId: string,
    @Param("workflowId") workflowId: string,
    @Param("executionId") executionId: string
  ) {
    return this.workflowsService.findExecutionEvents(workspaceId, workflowId, executionId);
  }

  @Get(":workflowId/executions/:executionId/nodes")
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workflow execution node progress.",
    type: WorkflowNodeExecutionResponseDto,
    isArray: true
  })
  findExecutionNodes(
    @Param("workspaceId") workspaceId: string,
    @Param("workflowId") workflowId: string,
    @Param("executionId") executionId: string
  ) {
    return this.workflowsService.findExecutionNodes(workspaceId, workflowId, executionId);
  }

  @Get(":workflowId/executions/:executionId")
  @WorkspaceRoles(
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
  )
  @ApiOkResponse({
    description: "Workflow execution details.",
    type: WorkflowExecutionResponseDto
  })
  findExecution(
    @Param("workspaceId") workspaceId: string,
    @Param("workflowId") workflowId: string,
    @Param("executionId") executionId: string
  ) {
    return this.workflowsService.findExecution(workspaceId, workflowId, executionId);
  }

  @Post(":workflowId/executions")
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER)
  @ApiCreatedResponse({
    description: "Workflow execution requested and queued for asynchronous processing.",
    type: WorkflowExecutionResponseDto
  })
  requestExecution(
    @Param("workspaceId") workspaceId: string,
    @Param("workflowId") workflowId: string,
    @Body(new ZodValidationPipe(createWorkflowExecutionSchema)) dto: CreateWorkflowExecutionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.workflowsService.requestExecution(workspaceId, workflowId, dto, user.sub);
  }
}
