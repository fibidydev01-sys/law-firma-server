// ===== FILE: src/modules/konflik/dto/query-konflik.dto.ts =====
import { IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class QueryKonflikDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ada_konflik?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  perkara_id?: string;
}
