// ===== FILE: src/modules/health/indicators/database.indicator.ts (TYPE-SAFE) =====
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../../prisma/prisma.service';

interface DatabaseHealthDetails {
  message: string;
}

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to execute a simple query
      await this.prisma.$queryRaw`SELECT 1`;

      const details: DatabaseHealthDetails = {
        message: 'Database is healthy',
      };

      return this.getStatus(key, true, details);
    } catch (error) {
      const err = error as Error;
      const details: DatabaseHealthDetails = {
        message: err.message,
      };

      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, details),
      );
    }
  }
}
