// ===== FILE: src/modules/monitoring/metrics/cache.metrics.ts =====
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class CacheMetrics {
  // Cache Hit Counter
  private readonly cacheHitCounter: Counter;

  // Cache Miss Counter
  private readonly cacheMissCounter: Counter;

  // Cache Size Gauge
  private readonly cacheSizeGauge: Gauge;

  // Cache Operation Duration
  private readonly cacheOperationDuration: Histogram;

  constructor() {
    this.cacheHitCounter = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['operation', 'key_pattern'],
      registers: [register],
    });

    this.cacheMissCounter = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['operation', 'key_pattern'],
      registers: [register],
    });

    this.cacheSizeGauge = new Gauge({
      name: 'cache_memory_bytes',
      help: 'Current cache memory usage in bytes',
      registers: [register],
    });

    this.cacheOperationDuration = new Histogram({
      name: 'cache_operation_duration_seconds',
      help: 'Duration of cache operations in seconds',
      labelNames: ['operation', 'result'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [register],
    });
  }

  recordHit(operation: string, keyPattern: string) {
    this.cacheHitCounter.inc({ operation, key_pattern: keyPattern });
  }

  recordMiss(operation: string, keyPattern: string) {
    this.cacheMissCounter.inc({ operation, key_pattern: keyPattern });
  }

  setCacheSize(bytes: number) {
    this.cacheSizeGauge.set(bytes);
  }

  recordOperationDuration(operation: string, result: string, duration: number) {
    this.cacheOperationDuration.observe({ operation, result }, duration / 1000);
  }
}
