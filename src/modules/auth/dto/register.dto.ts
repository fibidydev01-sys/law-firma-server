// ===== FILE: src/modules/auth/dto/register.dto.ts (FIXED) =====
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@perari.id' })
  @IsEmail({}, { message: 'Email harus valid' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  nama_lengkap: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.staff,
    description: 'Role user dalam sistem',
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role harus salah satu dari: admin, advokat, paralegal, staff',
  })
  role?: UserRole = UserRole.staff; // Default value

  @ApiPropertyOptional({ example: 'Legal Staff' })
  @IsOptional()
  @IsString()
  jabatan?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  telepon?: string;
}
