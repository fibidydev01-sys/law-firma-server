// ===== FILE: src/modules/auth/auth.controller.ts =====
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // ← FIX: Force 200 status for login
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 201 for new resource
  @ApiOperation({ summary: 'Register user baru' })
  @ApiResponse({ status: 201, description: 'Registrasi berhasil' })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid atau email sudah terdaftar',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('register-client')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register klien baru (client portal)' })
  @ApiResponse({ status: 201, description: 'Registrasi klien berhasil' })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid atau email sudah terdaftar',
  })
  registerClient(@Body() dto: RegisterDto) {
    // Force role to 'klien' for client portal registration
    return this.authService.register({ ...dto, role: 'klien' as any });
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profile berhasil diambil' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK) // ← 200 for password change
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ubah password' })
  @ApiResponse({ status: 200, description: 'Password berhasil diubah' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK) // ← 200 for token refresh
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token berhasil di-refresh' })
  refreshToken(@CurrentUser('id') userId: string) {
    return this.authService.refreshToken(userId);
  }
}
