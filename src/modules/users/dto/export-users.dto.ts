// ===== FILE: src/modules/users/dto/export-users.dto.ts (FIXED - NO ANY) =====
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QueryUserDto } from './query-user.dto';

export class ExportUsersDto {
  @ApiProperty({
    enum: ['csv', 'excel'],
    example: 'csv',
    description: 'Export format',
  })
  @IsEnum(['csv', 'excel'])
  format: 'csv' | 'excel';

  @ApiPropertyOptional({
    type: QueryUserDto,
    description: 'Filter criteria (same as QueryUserDto)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QueryUserDto)
  filters?: QueryUserDto;
}
