// ===== FILE: src/modules/tugas/dto/create-tugas.dto.ts =====
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusTugas, PrioritasTugas } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTugasDto {
  @ApiProperty({ example: 'uuid-perkara' })
  @IsUUID()
  perkara_id: string;

  @ApiProperty({ example: 'Draft Surat Gugatan' })
  @IsString()
  judul: string;

  @ApiPropertyOptional({ example: 'Membuat draft surat gugatan lengkap' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  ditugaskan_ke?: string;

  @ApiPropertyOptional({ enum: StatusTugas, default: StatusTugas.belum_mulai })
  @IsOptional()
  @IsEnum(StatusTugas)
  status?: StatusTugas;

  @ApiPropertyOptional({ enum: PrioritasTugas, default: PrioritasTugas.sedang })
  @IsOptional()
  @IsEnum(PrioritasTugas)
  prioritas?: PrioritasTugas;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  tenggat_waktu?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  dapat_ditagih?: boolean;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  jam_kerja?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tarif_per_jam?: number;
}
