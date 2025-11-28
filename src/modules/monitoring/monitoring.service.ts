// ===== FILE: src/modules/monitoring/monitoring.service.ts (TYPE-SAFE VERSION) =====
import { Injectable } from '@nestjs/common';
import { register } from 'prom-client';
import { HttpMetrics } from './metrics/http.metrics';
import { CacheMetrics } from './metrics/cache.metrics';
import { BusinessMetrics } from './metrics/business.metrics';
import { DatabaseMetrics } from './metrics/database.metrics';

@Injectable()
export class MonitoringService {
  constructor(
    private httpMetrics: HttpMetrics,
    private cacheMetrics: CacheMetrics,
    private businessMetrics: BusinessMetrics,
    private databaseMetrics: DatabaseMetrics,
  ) {}

  /**
   * 🔥 TYPE-SAFE: Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * 🔥 TYPE-SAFE: Get metrics as JSON
   */
  async getMetricsJSON(): Promise<unknown> {
    const metrics = await register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    register.resetMetrics();
  }

  /**
   * HTTP Metrics accessor
   */
  get http(): HttpMetrics {
    return this.httpMetrics;
  }

  /**
   * Cache Metrics accessor
   */
  get cache(): CacheMetrics {
    return this.cacheMetrics;
  }

  /**
   * Business Metrics accessor
   */
  get business(): BusinessMetrics {
    return this.businessMetrics;
  }

  /**
   * Database Metrics accessor
   */
  get database(): DatabaseMetrics {
    return this.databaseMetrics;
  }
}
