// ============================================================================
// FILE: server/src/modules/users/dto/bulk-delete.dto.ts
// ============================================================================

import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'Array of user IDs to delete',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  user_ids: string[];
}
