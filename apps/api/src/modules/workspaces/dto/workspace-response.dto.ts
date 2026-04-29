import { ApiProperty } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

import { UserProfileResponseDto } from "../../auth/dto/auth-response.dto.js";

export class WorkspaceMemberResponseDto {
  @ApiProperty({ example: "09254b49-7a32-48dc-bf07-cc5a80f69128" })
  id!: string;

  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.OWNER })
  role!: WorkspaceRole;

  @ApiProperty({ example: "2026-04-28T01:11:16.822Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-04-28T01:11:16.822Z" })
  updatedAt!: Date;

  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;
}

export class WorkspaceResponseDto {
  @ApiProperty({ example: "5197de4a-7a9a-4795-b455-e4ab877aba9b" })
  id!: string;

  @ApiProperty({ example: "Acme Automation" })
  name!: string;

  @ApiProperty({ example: "acme-automation" })
  slug!: string;

  @ApiProperty({ example: "2026-04-28T01:11:16.822Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-04-28T01:11:16.822Z" })
  updatedAt!: Date;

  @ApiProperty({ type: WorkspaceMemberResponseDto, isArray: true })
  members!: WorkspaceMemberResponseDto[];
}

export class RemoveWorkspaceMemberResponseDto {
  @ApiProperty({ example: true })
  removed!: true;
}
