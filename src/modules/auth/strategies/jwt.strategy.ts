// ===== FILE: src/modules/auth/strategies/jwt.strategy.ts (TYPE SAFE VERSION) =====
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload, UserPayload } from '../../../common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        nama_lengkap: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User tidak ditemukan atau token tidak valid',
      );
    }

    // Return UserPayload sesuai interface
    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      nama_lengkap: user.nama_lengkap || '',
    };

    return userPayload;
  }
}
