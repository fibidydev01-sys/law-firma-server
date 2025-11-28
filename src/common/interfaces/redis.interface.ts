// ============================================================================
// FILE: src/common/interfaces/redis.interface.ts
// ============================================================================

/**
 * Redis Connection Options
 */
export interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number;
}

/**
 * Cache Options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  namespace?: string;
}

/**
 * Redis Info Response
 */
export interface RedisInfoResponse {
  used_memory_human: string;
  used_memory_peak_human: string;
  mem_fragmentation_ratio: string;
  keyspace_hits: string;
  keyspace_misses: string;
  uptime_in_seconds: string;
  connected_clients: string;
  total_commands_processed: string;
  [key: string]: string;
}

/**
 * Redis Statistics
 */
export interface RedisStats {
  total_keys: number;
  memory: {
    used: string;
    peak: string;
    fragmentation_ratio: string;
  };
  hits_misses: {
    hits: number;
    misses: number;
    hit_rate: string;
  };
  uptime: {
    seconds: number;
    days: string;
  };
}

/**
 * Cache Compression Stats
 */
export interface CacheCompressionStats {
  enabled: boolean;
  threshold: number;
  thresholdFormatted: string;
}
