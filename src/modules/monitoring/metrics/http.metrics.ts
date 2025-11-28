// ===== FILE: src/modules/monitoring/metrics/http.metrics.ts =====
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class HttpMetrics {
  // HTTP Request Counter
  private readonly httpRequestCounter: Counter;

  // HTTP Request Duration Histogram
  private readonly httpRequestDuration: Histogram;

  // HTTP Error Counter
  private readonly httpErrorCounter: Counter;

  constructor() {
    // Request Counter
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    // Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [register],
    });

    // Error Counter
    this.httpErrorCounter = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
      registers: [register],
    });
  }

  recordRequest(method: string, route: string, statusCode: number) {
    this.httpRequestCounter.inc({ method, route, status_code: statusCode });
  }

  recordDuration(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration / 1000, // Convert to seconds
    );
  }

  recordError(
    method: string,
    route: string,
    statusCode: number,
    errorType: string,
  ) {
    this.httpErrorCounter.inc({
      method,
      route,
      status_code: statusCode,
      error_type: errorType,
    });
  }
}
