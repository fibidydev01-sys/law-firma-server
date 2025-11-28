// ============================================================================
// FILE: server/src/modules/tim-perkara/dto/update-tim-perkara.dto.ts
// ============================================================================
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTimPerkaraDto {
  @ApiPropertyOptional({
    example: 'Lead Counsel',
    description: 'Role anggota tim dalam perkara',
  })
  @IsOptional()
  @IsString()
  peran?: string;
}
