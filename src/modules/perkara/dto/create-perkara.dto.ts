// ===== FILE: src/modules/perkara/dto/create-perkara.dto.ts =====
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JenisPerkara, StatusPerkara, PrioritasTugas } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePerkaraDto {
  @ApiProperty({ example: 'PKR/2024/001' })
  @IsString()
  nomor_perkara: string;

  @ApiPropertyOptional({ example: '123/Pdt.G/2024/PN.Jkt.Sel' })
  @IsOptional()
  @IsString()
  nomor_perkara_pengadilan?: string;

  @ApiProperty({ example: 'Gugatan Wanprestasi PT ABC vs PT XYZ' })
  @IsString()
  judul: string;

  @ApiPropertyOptional({ example: 'Deskripsi lengkap perkara...' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'uuid-klien' })
  @IsOptional()
  @IsUUID()
  klien_id?: string;

  @ApiProperty({ enum: JenisPerkara, example: JenisPerkara.perdata })
  @IsEnum(JenisPerkara)
  jenis_perkara: JenisPerkara;

  @ApiPropertyOptional({ enum: StatusPerkara, default: StatusPerkara.aktif })
  @IsOptional()
  @IsEnum(StatusPerkara)
  status?: StatusPerkara;

  @ApiPropertyOptional({ enum: PrioritasTugas, default: PrioritasTugas.sedang })
  @IsOptional()
  @IsEnum(PrioritasTugas)
  prioritas?: PrioritasTugas;

  @ApiPropertyOptional({ example: 'PN', enum: ['PN', 'PT', 'MA'] })
  @IsOptional()
  @IsString()
  tingkat_pengadilan?: string;

  @ApiPropertyOptional({ example: 'Pengadilan Negeri Jakarta Selatan' })
  @IsOptional()
  @IsString()
  nama_pengadilan?: string;

  @ApiPropertyOptional({ example: 'Ruang 101' })
  @IsOptional()
  @IsString()
  nomor_ruang_sidang?: string;

  @ApiPropertyOptional({ example: 'Dr. Ahmad Yani, S.H., M.H.' })
  @IsOptional()
  @IsString()
  nama_hakim_ketua?: string;

  @ApiPropertyOptional({ example: 'Dr. Budi Santoso, S.H., M.H.' })
  @IsOptional()
  @IsString()
  nama_hakim_anggota_1?: string;

  @ApiPropertyOptional({ example: 'Dr. Citra Dewi, S.H., M.H.' })
  @IsOptional()
  @IsString()
  nama_hakim_anggota_2?: string;

  @ApiPropertyOptional({ example: 'Agus Priyanto, S.H.' })
  @IsOptional()
  @IsString()
  nama_panitera?: string;

  @ApiPropertyOptional({ example: 'Penggugat' })
  @IsOptional()
  @IsString()
  posisi_klien?: string;

  @ApiPropertyOptional({ example: 'PT XYZ Corporation' })
  @IsOptional()
  @IsString()
  pihak_lawan?: string;

  @ApiPropertyOptional({ example: 'Law Firm ABC & Partners' })
  @IsOptional()
  @IsString()
  kuasa_hukum_lawan?: string;

  @ApiPropertyOptional({ example: 5000000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  nilai_perkara?: number;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_register?: string;

  @ApiPropertyOptional({ example: '2024-02-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_sidang_pertama?: string;

  @ApiPropertyOptional({ example: '2024-03-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  tanggal_sidang_berikutnya?: string;

  @ApiPropertyOptional({ example: '2024-04-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  batas_waktu_banding?: string;

  @ApiPropertyOptional({ example: '2024-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  batas_waktu_kasasi?: string;

  @ApiPropertyOptional({ example: 1500000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  nilai_fee?: number;

  @ApiPropertyOptional({
    example: 'Lunas',
    enum: ['Lunas', 'Sebagian', 'Belum Bayar'],
  })
  @IsOptional()
  @IsString()
  status_pembayaran?: string;

  @ApiPropertyOptional({ example: 'Catatan tambahan perkara' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
