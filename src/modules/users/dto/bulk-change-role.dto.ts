// ============================================================================
// FILE: server/src/modules/users/dto/bulk-change-role.dto.ts
// ============================================================================

import { IsArray, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class BulkChangeRoleDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'Array of user IDs to update',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  user_ids: string[];

  @ApiProperty({
    enum: UserRole,
    example: UserRole.advokat,
    description: 'New role for selected users',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
