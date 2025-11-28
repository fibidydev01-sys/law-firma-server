// ===== FILE: src/modules/monitoring/monitoring.module.ts - COMPLETE =====
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { HttpMetrics } from './metrics/http.metrics';
import { CacheMetrics } from './metrics/cache.metrics';
import { BusinessMetrics } from './metrics/business.metrics';
import { DatabaseMetrics } from './metrics/database.metrics'; // 🔥 NEW IMPORT
import { MetricsInterceptor } from './metrics.interceptor';
import monitoringConfig from '../../config/monitoring.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(monitoringConfig),
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'firma_',
        },
      },
    }),
  ],
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
    HttpMetrics,
    CacheMetrics,
    BusinessMetrics,
    DatabaseMetrics, // 🔥 ADDED
    MetricsInterceptor,
  ],
  exports: [
    MonitoringService,
    HttpMetrics,
    CacheMetrics,
    BusinessMetrics,
    DatabaseMetrics, // 🔥 ADDED
    MetricsInterceptor,
  ],
})
export class MonitoringModule {}
