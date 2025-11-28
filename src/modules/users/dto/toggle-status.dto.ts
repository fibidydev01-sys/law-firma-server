// ============================================================================
// FILE: server/src/modules/users/dto/toggle-status.dto.ts
// ============================================================================
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleStatusDto {
  @ApiProperty({
    example: true,
    description: 'Set user active status',
  })
  @IsBoolean()
  active: boolean;
}
