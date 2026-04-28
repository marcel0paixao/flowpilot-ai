import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { WorkspacesService } from "./workspaces.service.js";

@ApiTags("workspaces")
@Controller("workspaces")
export class WorkspacesController {
  constructor(@Inject(WorkspacesService) private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiCreatedResponse({ description: "Workspace created with an initial owner membership." })
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: "Workspace list." })
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get(":id")
  @ApiOkResponse({ description: "Workspace details." })
  findOne(@Param("id") id: string) {
    return this.workspacesService.findOne(id);
  }
}
