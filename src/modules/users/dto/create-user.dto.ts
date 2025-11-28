// ===== FILE: src/modules/users/dto/create-user.dto.ts =====
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@perari.id' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe, S.H.' })
  @IsString()
  nama_lengkap: string;

  @ApiProperty({ enum: UserRole, example: UserRole.advokat })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'Advokat Senior' })
  @IsOptional()
  @IsString()
  jabatan?: string;

  @ApiPropertyOptional({ example: 'ADV-2024-001' })
  @IsOptional()
  @IsString()
  nomor_kta?: string;

  @ApiPropertyOptional({ example: 'BA-001/2024/PN-JKT' })
  @IsOptional()
  @IsString()
  nomor_berita_acara?: string;

  @ApiPropertyOptional({ example: 'Hukum Perdata, Hukum Pidana' })
  @IsOptional()
  @IsString()
  spesialisasi?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  telepon?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString()
  alamat?: string;
}
