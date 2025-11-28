// ===== FILE: src/modules/klien/dto/create-klien.dto.ts =====
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKlienDto {
  @ApiProperty({ example: 'PT. Teknologi Indonesia' })
  @IsString()
  nama: string;

  @ApiPropertyOptional({
    example: 'perorangan',
    enum: ['perorangan', 'perusahaan', 'organisasi'],
  })
  @IsOptional()
  @IsString()
  jenis_klien?: string;

  @ApiPropertyOptional({ example: '3174010101900001' })
  @IsOptional()
  @IsString()
  nomor_identitas?: string;

  @ApiPropertyOptional({ example: '01.234.567.8-901.000' })
  @IsOptional()
  @IsString()
  npwp?: string;

  @ApiPropertyOptional({ example: 'contact@teknologi.co.id' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  telepon?: string;

  @ApiPropertyOptional({ example: '081298765432' })
  @IsOptional()
  @IsString()
  telepon_alternatif?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: 'Menteng' })
  @IsOptional()
  @IsString()
  kelurahan?: string;

  @ApiPropertyOptional({ example: 'Menteng' })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiPropertyOptional({ example: 'Jakarta Pusat' })
  @IsOptional()
  @IsString()
  kota?: string;

  @ApiPropertyOptional({ example: 'DKI Jakarta' })
  @IsOptional()
  @IsString()
  provinsi?: string;

  @ApiPropertyOptional({ example: '10310' })
  @IsOptional()
  @IsString()
  kode_pos?: string;

  @ApiPropertyOptional({ example: 'PT. Teknologi Indonesia' })
  @IsOptional()
  @IsString()
  nama_perusahaan?: string;

  @ApiPropertyOptional({ example: 'PT' })
  @IsOptional()
  @IsString()
  bentuk_badan_usaha?: string;

  @ApiPropertyOptional({ example: 'AHU-0012345.AH.01.01.Tahun 2020' })
  @IsOptional()
  @IsString()
  nomor_akta?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  nama_kontak_darurat?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  telepon_kontak_darurat?: string;

  @ApiPropertyOptional({ example: 'Catatan tambahan tentang klien' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
