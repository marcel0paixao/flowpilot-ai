import { ApiProperty } from "@nestjs/swagger";
import { WorkflowStatus } from "@prisma/client/index";

export class WorkflowVersionResponseDto {
  @ApiProperty({ example: "version-id" })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({
    example: {
      nodes: [],
      edges: []
    }
  })
  definition!: Record<string, unknown>;

  @ApiProperty({ example: "2026-05-01T12:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-05-01T12:00:00.000Z" })
  updatedAt!: Date;
}

export class WorkflowResponseDto {
  @ApiProperty({ example: "workflow-id" })
  id!: string;

  @ApiProperty({ example: "workspace-id" })
  workspaceId!: string;

  @ApiProperty({ example: "Lead Enrichment" })
  name!: string;

  @ApiProperty({ example: "lead-enrichment" })
  slug!: string;

  @ApiProperty({ example: "Enriches inbound leads with AI and CRM data.", nullable: true })
  description!: string | null;

  @ApiProperty({ enum: WorkflowStatus, example: WorkflowStatus.DRAFT })
  status!: WorkflowStatus;

  @ApiProperty({ type: WorkflowVersionResponseDto })
  currentVersion!: WorkflowVersionResponseDto;

  @ApiProperty({ example: "2026-05-01T12:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-05-01T12:00:00.000Z" })
  updatedAt!: Date;
}
