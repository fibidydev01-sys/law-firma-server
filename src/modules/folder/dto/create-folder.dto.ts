import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({
    description: 'ID perkara yang terkait dengan folder',
    example: 'abc123-def456',
  })
  @IsString()
  perkara_id: string;

  @ApiProperty({
    description: 'Nama folder',
    example: 'Dokumen Bukti',
  })
  @IsString()
  nama_folder: string;

  @ApiPropertyOptional({
    description: 'ID parent folder untuk subfolder (nested)',
    example: 'parent-folder-id',
  })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({
    description: 'Warna folder untuk visual organization (hex color)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  warna?: string;

  @ApiPropertyOptional({
    description: 'Icon name untuk folder',
    example: 'folder',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Urutan custom untuk sorting',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  urutan?: number;
}
