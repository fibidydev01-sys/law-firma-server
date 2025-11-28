// ===== FILE: src/modules/monitoring/metrics/database.metrics.ts =====
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class DatabaseMetrics {
  // Query Counter
  private readonly queryCounter: Counter;

  // Query Duration Histogram
  private readonly queryDuration: Histogram;

  // Slow Query Counter
  private readonly slowQueryCounter: Counter;

  // Active Connections Gauge
  private readonly activeConnections: Gauge;

  // Transaction Counter
  private readonly transactionCounter: Counter;

  // Database Error Counter
  private readonly dbErrorCounter: Counter;

  constructor() {
    this.queryCounter = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'model'],
      registers: [register],
    });

    this.queryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 1ms to 5s
      registers: [register],
    });

    this.slowQueryCounter = new Counter({
      name: 'db_slow_queries_total',
      help: 'Total number of slow queries (>1s)',
      labelNames: ['operation', 'model'],
      registers: [register],
    });

    this.activeConnections = new Gauge({
      name: 'db_active_connections',
      help: 'Current number of active database connections',
      registers: [register],
    });

    this.transactionCounter = new Counter({
      name: 'db_transactions_total',
      help: 'Total number of database transactions',
      labelNames: ['status'], // success, rollback, error
      registers: [register],
    });

    this.dbErrorCounter = new Counter({
      name: 'db_errors_total',
      help: 'Total number of database errors',
      labelNames: ['error_type', 'operation'],
      registers: [register],
    });
  }

  recordQuery(operation: string, model: string, duration: number) {
    this.queryCounter.inc({ operation, model });
    this.queryDuration.observe({ operation, model }, duration / 1000);

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      this.slowQueryCounter.inc({ operation, model });
    }
  }

  recordTransaction(status: 'success' | 'rollback' | 'error') {
    this.transactionCounter.inc({ status });
  }

  recordError(errorType: string, operation: string) {
    this.dbErrorCounter.inc({ error_type: errorType, operation });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }
}
