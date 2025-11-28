// ============================================================================
// FILE: src/common/interfaces/metrics.interface.ts
// ============================================================================

/**
 * HTTP Metrics Labels
 */
export interface HttpMetricsLabels {
  method: string;
  route: string;
  status_code: number;
}

/**
 * HTTP Error Metrics Labels
 */
export interface HttpErrorMetricsLabels extends HttpMetricsLabels {
  error_type: string;
}

/**
 * Cache Metrics Labels
 */
export interface CacheMetricsLabels {
  operation: string;
  key_pattern: string;
}

/**
 * Database Metrics Labels
 */
export interface DatabaseMetricsLabels {
  operation: string;
  model: string;
}

/**
 * Business Metrics Labels
 */
export interface BusinessMetricsLabels {
  action: string;
  entity_type: string;
}

/**
 * Metrics Summary
 */
export interface MetricsSummary {
  http: {
    total_requests: number;
    average_duration: number;
    error_rate: number;
  };
  cache: {
    hit_rate: number;
    total_operations: number;
    memory_usage: number;
  };
  database: {
    total_queries: number;
    average_duration: number;
    slow_queries: number;
  };
}
