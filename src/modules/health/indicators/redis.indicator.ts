// ===== FILE: src/modules/health/indicators/redis.indicator.ts (TYPE-SAFE) =====
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisCacheService } from '../../cache/redis-cache.service';

interface RedisHealthDetails {
  message: string;
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private cacheService: RedisCacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.cacheService.ping();

      if (result === 'PONG') {
        const details: RedisHealthDetails = {
          message: 'Redis is healthy',
        };
        return this.getStatus(key, true, details);
      }

      throw new Error('Redis ping failed');
    } catch (error) {
      const err = error as Error;
      const details: RedisHealthDetails = {
        message: err.message,
      };

      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, details),
      );
    }
  }
}
