// ===== FILE: src/health/health.module.ts =====
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisCacheModule } from '../../modules/cache/redis-cache.module';

@Module({
  imports: [TerminusModule, PrismaModule, RedisCacheModule],
  controllers: [HealthController],
})
export class HealthModule {}
