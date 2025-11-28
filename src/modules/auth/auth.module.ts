import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

/**
 * 🔥 TYPE-SAFE: Parse JWT expiration time
 * Supports: '7d', '1h', '30m', 3600 (seconds)
 */
function parseExpiresIn(
  expiresIn: string | number | undefined,
): string | number {
  if (!expiresIn) {
    return '7d';
  }

  if (typeof expiresIn === 'number') {
    return expiresIn;
  }

  if (/^\d+[smhd]$/.test(expiresIn)) {
    return expiresIn;
  }

  const parsed = parseInt(expiresIn, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return '7d';
}

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret =
          configService.get<string>('jwt.secret') ||
          'your-secret-key-change-in-production';

        const rawExpiresIn = configService.get<string>('jwt.expiresIn') || '7d';
        const expiresIn = parseExpiresIn(rawExpiresIn);

        // ✅ FIX: Type assertion to tell TypeScript this is safe
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
