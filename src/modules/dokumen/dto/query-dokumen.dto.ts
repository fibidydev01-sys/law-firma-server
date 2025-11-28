// ===== FILE: src/modules/dokumen/dto/query-dokumen.dto.ts =====
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { KategoriDokumen } from '@prisma/client';

export class QueryDokumenDto extends PaginationDto {
  @ApiPropertyOptional({ enum: KategoriDokumen })
  @IsOptional()
  @IsEnum(KategoriDokumen)
  kategori?: KategoriDokumen;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  perkara_id?: string;

  @ApiPropertyOptional({ description: 'Filter by folder ID (use "null" for root/no folder)' })
  @IsOptional()
  folder_id?: string;
}
