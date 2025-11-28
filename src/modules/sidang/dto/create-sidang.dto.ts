// ===== FILE: src/modules/sidang/dto/create-sidang.dto.ts =====
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JenisSidang } from '@prisma/client';

export class CreateSidangDto {
  @ApiProperty({ example: 'uuid-perkara' })
  @IsUUID()
  perkara_id: string;

  @ApiProperty({ enum: JenisSidang, example: JenisSidang.sidang_pertama })
  @IsEnum(JenisSidang)
  jenis_sidang: JenisSidang;

  @ApiProperty({ example: '2024-02-01T09:00:00Z' })
  @IsDateString()
  tanggal_sidang: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  waktu_mulai?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  waktu_selesai?: string;

  @ApiProperty({ example: 'Pengadilan Negeri Jakarta Selatan' })
  @IsString()
  nama_pengadilan: string;

  @ApiPropertyOptional({ example: 'Ruang 101' })
  @IsOptional()
  @IsString()
  nomor_ruang_sidang?: string;

  @ApiPropertyOptional({ example: 'Dr. Ahmad Yani, S.H., M.H.' })
  @IsOptional()
  @IsString()
  nama_hakim?: string;

  @ApiPropertyOptional({ example: 'Jl. Ampera Raya No. 133' })
  @IsOptional()
  @IsString()
  lokasi_lengkap?: string;

  @ApiPropertyOptional({ example: 'Pembacaan gugatan dan jawaban' })
  @IsOptional()
  @IsString()
  agenda_sidang?: string;

  @ApiPropertyOptional({ example: 'Sidang ditunda hingga tanggal berikutnya' })
  @IsOptional()
  @IsString()
  hasil_sidang?: string;

  @ApiPropertyOptional({ example: 'Mengabulkan gugatan penggugat' })
  @IsOptional()
  @IsString()
  putusan?: string;

  @ApiPropertyOptional({ example: 'Catatan tambahan sidang' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
