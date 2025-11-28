// ===== FILE: src/modules/perkara/dto/query-perkara.dto.ts =====
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JenisPerkara, StatusPerkara } from '@prisma/client';

export class QueryPerkaraDto extends PaginationDto {
  @ApiPropertyOptional({ enum: JenisPerkara })
  @IsOptional()
  @IsEnum(JenisPerkara)
  jenis_perkara?: JenisPerkara;

  @ApiPropertyOptional({ enum: StatusPerkara })
  @IsOptional()
  @IsEnum(StatusPerkara)
  status?: StatusPerkara;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  klien_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  nama_pengadilan?: string;
}
