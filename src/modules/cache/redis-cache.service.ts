// ===== FILE: src/modules/cache/redis-cache.service.ts (TYPE-SAFE VERSION) =====
import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheCompressionService } from './cache-compression.service';
import { CacheMetrics } from '../monitoring/metrics/cache.metrics';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly namespace = 'firma';
  private memoryTrackingInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly compression: CacheCompressionService,
    private readonly metrics: CacheMetrics,
  ) {
    // Start periodic memory tracking
    this.startMemoryTracking();
  }

  private startMemoryTracking(): void {
    // 🔥 TYPE-SAFE: Properly handle async in setInterval
    this.memoryTrackingInterval = setInterval(() => {
      void this.trackMemory();
    }, 30000); // Every 30 seconds
  }

  private async trackMemory(): Promise<void> {
    try {
      const info = await this.redisClient.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match && match[1]) {
        const usedMemory = parseInt(match[1], 10);
        this.metrics.setCacheSize(usedMemory);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to track Redis memory:', errorMessage);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const fullKey = this.getFullKey(key);
      const value = await this.redisClient.get(fullKey);

      const duration = Date.now() - startTime;

      if (!value) {
        console.log(`❌ Cache MISS: ${fullKey}`);
        this.metrics.recordMiss('get', this.getKeyPattern(key));
        this.metrics.recordOperationDuration('get', 'miss', duration);
        return null;
      }

      console.log(`✅ Cache HIT: ${fullKey}`);
      this.metrics.recordHit('get', this.getKeyPattern(key));
      this.metrics.recordOperationDuration('get', 'hit', duration);

      const decompressed = await this.compression.decompress(value);
      return decompressed as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis GET error [${key}]:`, errorMessage);
      this.metrics.recordOperationDuration('get', 'error', duration);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const fullKey = this.getFullKey(key);
      const compressed = await this.compression.compress(value);

      await this.redisClient.setex(fullKey, ttlSeconds, compressed);

      const duration = Date.now() - startTime;
      const size = Buffer.byteLength(compressed, 'utf8');
      const sizeKB = (size / 1024).toFixed(2);

      console.log(
        `💾 Cache SET: ${fullKey} (TTL: ${ttlSeconds}s, Size: ${sizeKB} KB)`,
      );

      this.metrics.recordOperationDuration('set', 'success', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis SET error [${key}]:`, errorMessage);
      this.metrics.recordOperationDuration('set', 'error', duration);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    try {
      const fullKey = this.getFullKey(key);
      await this.redisClient.del(fullKey);

      const duration = Date.now() - startTime;
      console.log(`🗑️  Cache DEL: ${fullKey}`);
      this.metrics.recordOperationDuration('del', 'success', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis DEL error [${key}]:`, errorMessage);
      this.metrics.recordOperationDuration('del', 'error', duration);
    }
  }

  async delPattern(pattern: string): Promise<number> {
    const startTime = Date.now();
    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.redisClient.keys(fullPattern);

      if (keys.length === 0) {
        console.log(`🔍 No keys found for pattern: ${fullPattern}`);
        return 0;
      }

      const deleted = await this.redisClient.del(...keys);
      const duration = Date.now() - startTime;

      console.log(`🗑️  Cache DEL Pattern: ${fullPattern} (${deleted} keys)`);
      this.metrics.recordOperationDuration('delPattern', 'success', duration);
      return deleted;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis DEL Pattern error [${pattern}]:`, errorMessage);
      this.metrics.recordOperationDuration('delPattern', 'error', duration);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redisClient.exists(fullKey);
      return result === 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis EXISTS error [${key}]:`, errorMessage);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.redisClient.ttl(fullKey);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis TTL error [${key}]:`, errorMessage);
      return -1;
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.redisClient.keys(fullPattern);
      return keys.map((key) => key.replace(`${this.namespace}:`, ''));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️  Redis KEYS error [${pattern}]:`, errorMessage);
      return [];
    }
  }

  async flushDb(): Promise<void> {
    try {
      await this.redisClient.flushdb();
      console.log('🗑️  Redis FLUSHDB executed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('⚠️  Redis FLUSHDB error:', errorMessage);
      throw error;
    }
  }

  async info(): Promise<string> {
    try {
      return await this.redisClient.info();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('⚠️  Redis INFO error:', errorMessage);
      return '';
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.redisClient.ping();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('⚠️  Redis PING error:', errorMessage);
      return 'ERROR';
    }
  }

  getCompressionStats() {
    return this.compression.getStats();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  private getFullKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  // 🔥 TYPE-SAFE: Extract key pattern for metrics grouping
  private getKeyPattern(key: string): string {
    // Extract pattern like "klien:findAll" from "klien:findAll:{"page":1}"
    const match = key.match(/^([^:]+:[^:]+)/);
    return match ? match[1] : key.split(':')[0];
  }

  async onModuleDestroy() {
    // Clear the memory tracking interval
    if (this.memoryTrackingInterval) {
      clearInterval(this.memoryTrackingInterval);
    }

    await this.redisClient.quit();
    console.log('✅ Redis Client disconnected');
  }
}
