// ===== FILE: src/modules/dokumen/dto/create-dokumen.dto.ts =====
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KategoriDokumen } from '@prisma/client';

export class CreateDokumenDto {
  @ApiProperty({ example: 'uuid-perkara' })
  @IsUUID()
  perkara_id: string;

  @ApiPropertyOptional({ example: 'Surat Gugatan Lengkap.pdf' })
  @IsOptional()
  @IsString()
  nama_dokumen?: string;

  @ApiProperty({ enum: KategoriDokumen, example: KategoriDokumen.gugatan })
  @IsEnum(KategoriDokumen)
  kategori: KategoriDokumen;

  @ApiPropertyOptional({ example: 'P-001' })
  @IsOptional()
  @IsString()
  nomor_bukti?: string;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_dokumen?: string;

  @ApiPropertyOptional({ example: 'Catatan dokumen' })
  @IsOptional()
  @IsString()
  catatan?: string;

  @ApiPropertyOptional({ example: 'uuid-folder', description: 'ID folder untuk organize dokumen (optional)' })
  @IsOptional()
  @IsUUID()
  folder_id?: string;
}
