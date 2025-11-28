// ============================================================================
// FILE: src/common/interfaces/logger.interface.ts
// ============================================================================

/**
 * Log Level
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

/**
 * Log Context
 */
export interface LogContext {
  context?: string;
  trace?: string;
  [key: string]: unknown;
}

/**
 * HTTP Request Log Metadata
 */
export interface HttpLogMetadata {
  method: string;
  url: string;
  statusCode: number;
  responseTime: string;
  ip: string;
  userAgent: string;
}

/**
 * Database Query Log
 */
export interface DatabaseQueryLog {
  query: string;
  duration: string;
  params?: unknown;
  category: 'database';
}

/**
 * Cache Operation Log
 */
export interface CacheOperationLog {
  operation: string;
  key: string;
  result: 'hit' | 'miss' | 'set' | 'del';
  category: 'cache';
}

/**
 * Business Event Log
 */
export interface BusinessEventLog {
  event: string;
  data: Record<string, unknown>;
  category: 'business';
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  console: {
    enabled: boolean;
    colorize: boolean;
  };
  file?: {
    enabled: boolean;
    directory: string;
    maxSize: string;
    maxFiles: string;
  };
}
