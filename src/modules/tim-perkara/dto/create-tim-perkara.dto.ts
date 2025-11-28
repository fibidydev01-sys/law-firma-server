// ===== FILE: src/modules/tim-perkara/dto/create-tim-perkara.dto.ts =====
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimPerkaraDto {
  @ApiProperty({ example: 'uuid-perkara' })
  @IsUUID()
  perkara_id: string;

  @ApiProperty({ example: 'uuid-user' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ example: 'Lead Counsel' })
  @IsOptional()
  @IsString()
  peran?: string;
}
