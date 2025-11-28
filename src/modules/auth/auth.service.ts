// ===== FILE: src/modules/auth/auth.service.ts (TYPE SAFE VERSION) =====
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse, JwtPayload, UserEntity } from '../../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    try {
      // 1. Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Email atau password salah');
      }

      console.log('🔍 Login attempt:', {
        email: dto.email,
        userFound: !!user,
        passwordLength: dto.password?.length,
        hashedPasswordLength: user.password?.length,
      });

      // 2. Verify password
      let isPasswordValid = false;
      try {
        isPasswordValid = await bcrypt.compare(dto.password, user.password);
        console.log('🔐 Password verification:', {
          isValid: isPasswordValid,
          inputPassword: dto.password,
          storedHash: user.password.substring(0, 20) + '...',
        });
      } catch (bcryptError) {
        console.error('❌ Bcrypt error:', bcryptError);
        throw new InternalServerErrorException(
          'Terjadi kesalahan saat memverifikasi password',
        );
      }

      if (!isPasswordValid) {
        console.log('❌ Password mismatch for user:', dto.email);
        throw new UnauthorizedException('Email atau password salah');
      }

      console.log('✅ Password valid for user:', dto.email);

      // 3. Generate JWT token
      let token: string;
      try {
        const payload: JwtPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };
        token = this.jwtService.sign(payload);
        console.log('✅ Token generated:', token.substring(0, 30) + '...');
      } catch (jwtError) {
        console.error('❌ JWT signing error:', jwtError);
        throw new InternalServerErrorException(
          'Terjadi kesalahan saat membuat token',
        );
      }

      // 4. Log activity (non-blocking)
      try {
        await this.prisma.logAktivitas.create({
          data: {
            user_id: user.id,
            aksi: 'LOGIN',
            detail: { email: user.email },
          },
        });
        console.log('✅ Login activity logged');
      } catch (logError) {
        console.error('⚠️  Failed to create login log:', logError);
      }

      // 5. Return response with proper typing
      const authResponse: AuthResponse = {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          nama_lengkap: user.nama_lengkap || '', // Handle null
          role: user.role,
          jabatan: user.jabatan,
          avatar_url: user.avatar_url,
        },
      };

      return authResponse;
    } catch (error) {
      // Re-throw expected errors
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log unexpected errors
      console.error('❌ Unexpected login error:', error);
      throw new InternalServerErrorException(
        'Terjadi kesalahan pada server. Silakan coba lagi.',
      );
    }
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    try {
      console.log('📝 Registration attempt:', {
        email: dto.email,
        nama_lengkap: dto.nama_lengkap,
        role: dto.role,
      });

      // Check existing user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        console.log('⚠️  Email already registered:', dto.email);
        throw new BadRequestException('Email sudah terdaftar');
      }

      // Hash password with explicit rounds
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

      console.log('🔐 Password hashed:', {
        originalLength: dto.password.length,
        hashedLength: hashedPassword.length,
        hashPrefix: hashedPassword.substring(0, 20) + '...',
      });

      // Ensure role has default value
      const role = dto.role || 'staff';

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          nama_lengkap: dto.nama_lengkap,
          role: role,
          jabatan: dto.jabatan || null,
          telepon: dto.telepon || null,
        },
      });

      console.log('✅ User created successfully:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // ✅ Auto-create Klien record if role is 'klien' (for perkara dropdown)
      if (role === 'klien') {
        try {
          const klien = await this.prisma.klien.create({
            data: {
              nama: dto.nama_lengkap,
              email: dto.email,
              telepon: dto.telepon || null,
              jenis_klien: 'perorangan',
              dibuat_oleh: user.id, // Track who created this klien record
            },
          });

          // Create akses_portal link
          await this.prisma.aksesPortalKlien.create({
            data: {
              user_id: user.id,
              klien_id: klien.id,
            },
          });

          console.log('✅ Klien record auto-created:', {
            klien_id: klien.id,
            user_id: user.id,
          });
        } catch (klienError) {
          console.error('⚠️ Failed to create klien record:', klienError);
          // Don't fail registration if klien creation fails
        }
      }

      // Generate token with proper typing
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);

      // Log activity
      try {
        await this.prisma.logAktivitas.create({
          data: {
            user_id: user.id,
            aksi: 'REGISTER',
            detail: { email: user.email },
          },
        });
      } catch (logError) {
        console.error('⚠️  Failed to create registration log:', logError);
      }

      const authResponse: AuthResponse = {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          nama_lengkap: user.nama_lengkap || '', // Handle null
          role: user.role,
          jabatan: user.jabatan,
          avatar_url: user.avatar_url,
        },
      };

      return authResponse;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Registration error:', error);
      throw new InternalServerErrorException(
        'Terjadi kesalahan saat registrasi',
      );
    }
  }

  async getProfile(userId: string): Promise<Omit<UserEntity, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nama_lengkap: true,
        role: true,
        jabatan: true,
        nomor_kta: true,
        nomor_berita_acara: true,
        spesialisasi: true,
        avatar_url: true,
        telepon: true,
        alamat: true,
        is_active: true, // ✅ FIXED: Added is_active
        tanggal_bergabung: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.old_password,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        user_id: userId,
        aksi: 'CHANGE_PASSWORD',
      },
    });

    return { message: 'Password berhasil diubah' };
  }

  async refreshToken(userId: string): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
