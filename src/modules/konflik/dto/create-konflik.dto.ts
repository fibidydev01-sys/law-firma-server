// ===== FILE: src/modules/konflik/dto/create-konflik.dto.ts =====
import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKonflikDto {
  @ApiPropertyOptional({ example: 'uuid-perkara' })
  @IsOptional()
  @IsUUID()
  perkara_id?: string;

  @ApiProperty({ example: 'PT. Teknologi Indonesia' })
  @IsString()
  nama_klien: string;

  @ApiProperty({ example: 'PT. ABC Corporation' })
  @IsString()
  pihak_lawan: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  ada_konflik: boolean;

  @ApiPropertyOptional({
    example: 'Konflik kepentingan dengan klien sebelumnya',
  })
  @IsOptional()
  @IsString()
  detail_konflik?: string;
}
