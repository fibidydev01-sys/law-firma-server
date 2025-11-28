// ===== FILE: src/modules/tugas/dto/query-tugas.dto.ts =====
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { StatusTugas, PrioritasTugas } from '@prisma/client';

export class QueryTugasDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StatusTugas })
  @IsOptional()
  @IsEnum(StatusTugas)
  status?: StatusTugas;

  @ApiPropertyOptional({ enum: PrioritasTugas })
  @IsOptional()
  @IsEnum(PrioritasTugas)
  prioritas?: PrioritasTugas;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  perkara_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ditugaskan_ke?: string;
}
