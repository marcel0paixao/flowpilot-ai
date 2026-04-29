import { ApiProperty } from "@nestjs/swagger";
import { WorkspaceRole } from "@prisma/client/index";

export class UserResponseDto {
  @ApiProperty({ example: "7f6221c1-5dc7-418e-ae6d-950e0dd5085c" })
  id!: string;

  @ApiProperty({ example: "owner@acme.test" })
  email!: string;

  @ApiProperty({ example: "Acme Owner" })
  displayName!: string;
}

export class UserProfileResponseDto extends UserResponseDto {
  @ApiProperty({ example: "2026-04-28T01:11:16.818Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-04-28T02:33:01.902Z" })
  updatedAt!: Date;
}

export class AuthWorkspaceResponseDto {
  @ApiProperty({ example: "5197de4a-7a9a-4795-b455-e4ab877aba9b" })
  id!: string;

  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.OWNER })
  role!: WorkspaceRole;
}

export class RegisterResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ type: AuthWorkspaceResponseDto, nullable: true })
  workspace!: AuthWorkspaceResponseDto | null;
}

export class CurrentUserWorkspaceResponseDto {
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
}

export class CurrentUserMembershipResponseDto {
  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.OWNER })
  role!: WorkspaceRole;

  @ApiProperty({ type: CurrentUserWorkspaceResponseDto })
  workspace!: CurrentUserWorkspaceResponseDto;
}

export class CurrentUserResponseDto extends UserProfileResponseDto {
  @ApiProperty({ type: CurrentUserMembershipResponseDto, isArray: true })
  memberships!: CurrentUserMembershipResponseDto[];
}

export class MeResponseDto {
  @ApiProperty({ type: CurrentUserResponseDto })
  user!: CurrentUserResponseDto;
}
