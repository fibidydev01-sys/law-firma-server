import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryFolderDto {
  @ApiPropertyOptional({
    description: 'Filter by perkara ID',
    example: 'abc123',
  })
  @IsOptional()
  @IsString()
  perkara_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by parent folder ID (null for root folders)',
    example: 'parent-id',
  })
  @IsOptional()
  @IsString()
  parent_id?: string;
}
