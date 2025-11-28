// ===== FILE: src/modules/klien/dto/query-klien.dto.ts =====
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryKlienDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['perorangan', 'perusahaan', 'organisasi'] })
  @IsOptional()
  @IsEnum(['perorangan', 'perusahaan', 'organisasi'])
  jenis_klien?: string;

  @ApiPropertyOptional()
  @IsOptional()
  kota?: string;
}
