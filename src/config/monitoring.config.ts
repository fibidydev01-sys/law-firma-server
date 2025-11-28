// ===== FILE: src/config/monitoring.config.ts =====
import { registerAs } from '@nestjs/config';

export default registerAs('monitoring', () => ({
  // Prometheus
  prometheus: {
    enabled: process.env.PROMETHEUS_ENABLED === 'true' || true,
    endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
    defaultLabels: {
      app: 'firma-hukum-api',
      environment: process.env.NODE_ENV || 'development',
    },
  },

  // Metrics Collection
  metrics: {
    // HTTP Metrics
    http: {
      enabled: true,
      buckets: [0.1, 0.5, 1, 2, 5], // Response time buckets (seconds)
    },

    // Database Metrics
    database: {
      enabled: true,
      slowQueryThreshold: 1000, // milliseconds
    },

    // Cache Metrics
    cache: {
      enabled: true,
      trackKeys: true,
    },

    // Business Metrics
    business: {
      enabled: true,
      trackUserActions: true,
    },
  },

  // Health Checks
  health: {
    endpoint: '/health',
    liveness: '/health/liveness',
    readiness: '/health/readiness',
  },

  // Alert Thresholds
  alerts: {
    errorRate: 0.05, // 5%
    responseTime: 2000, // 2 seconds
    cacheHitRate: 0.7, // 70%
  },
}));
