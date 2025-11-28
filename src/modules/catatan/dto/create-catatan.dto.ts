// ===== FILE: src/modules/catatan/dto/create-catatan.dto.ts =====
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCatatanDto {
  @ApiProperty({ example: 'uuid-perkara' })
  @IsUUID()
  perkara_id: string;

  @ApiProperty({ example: 'Diskusi dengan klien membahas strategi pembelaan' })
  @IsString()
  catatan: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  dapat_ditagih?: boolean;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  jam_kerja?: number;
}
