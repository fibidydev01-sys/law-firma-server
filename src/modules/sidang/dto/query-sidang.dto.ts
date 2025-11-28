// ===== FILE: src/modules/sidang/dto/query-sidang.dto.ts =====
import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JenisSidang } from '@prisma/client';

export class QuerySidangDto extends PaginationDto {
  @ApiPropertyOptional({ enum: JenisSidang })
  @IsOptional()
  @IsEnum(JenisSidang)
  jenis_sidang?: JenisSidang;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  perkara_id?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_dari?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  tanggal_sampai?: string;
}
