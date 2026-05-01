import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

export class CreateWorkflowDto {
  @ApiProperty({ example: "Lead Enrichment" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "lead-enrichment" })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must use lowercase letters, numbers, and single hyphens"
  })
  slug!: string;

  @ApiProperty({ example: "Enriches inbound leads with AI and CRM data.", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: {
      nodes: [],
      edges: []
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  definition?: Record<string, unknown>;
}
