// ===== FILE: src/modules/logs/dto/query-logs.dto.ts =====
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryLogsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'CREATE_PERKARA' })
  @IsOptional()
  @IsString()
  aksi?: string;

  @ApiPropertyOptional({ example: 'perkara' })
  @IsOptional()
  @IsString()
  jenis_entitas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_dari?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  tanggal_sampai?: string;
}
