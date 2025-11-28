// ===== FILE: src/modules/cache/cache-compression.service.ts (TYPE-SAFE VERSION) =====
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import { CacheCompressionStats } from '../../common/interfaces';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

@Injectable()
export class CacheCompressionService {
  private readonly enabled: boolean;
  private readonly threshold: number;
  private readonly COMPRESSION_MARKER = 'gzip:';

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>(
      'CACHE_COMPRESSION_ENABLED',
      true,
    );
    this.threshold = this.configService.get<number>(
      'CACHE_COMPRESSION_THRESHOLD',
      1024,
    ); // 1KB
  }

  /**
   * 🔥 TYPE-SAFE: Compress data if enabled and size exceeds threshold
   */
  async compress<T>(data: T): Promise<string> {
    if (!this.enabled) {
      return JSON.stringify(data);
    }

    const jsonString = JSON.stringify(data);

    // Only compress if data is large enough
    if (jsonString.length < this.threshold) {
      return jsonString;
    }

    try {
      const buffer = Buffer.from(jsonString);
      const compressed = await gzipAsync(buffer);
      const base64 = compressed.toString('base64');

      // Calculate compression ratio
      const ratio = ((1 - base64.length / jsonString.length) * 100).toFixed(2);

      console.log(
        `💾 Compressed data: ${jsonString.length} → ${base64.length} bytes (${ratio}% reduction)`,
      );

      // Add marker to identify compressed data
      return `${this.COMPRESSION_MARKER}${base64}`;
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Compression error:', err.message);
      // Fallback to uncompressed
      return jsonString;
    }
  }

  /**
   * 🔥 TYPE-SAFE: Decompress data if it's marked as compressed
   */
  async decompress<T = unknown>(data: string): Promise<T | null> {
    if (!data) return null;

    // Check if data is compressed
    if (!data.startsWith(this.COMPRESSION_MARKER)) {
      // Not compressed, parse normally
      try {
        return JSON.parse(data) as T;
      } catch (error) {
        const err = error as Error;
        console.error('⚠️  JSON parse error:', err.message);
        return null;
      }
    }

    try {
      // Remove marker and decompress
      const base64Data = data.substring(this.COMPRESSION_MARKER.length);
      const buffer = Buffer.from(base64Data, 'base64');
      const decompressed = await gunzipAsync(buffer);
      const jsonString = decompressed.toString();

      return JSON.parse(jsonString) as T;
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Decompression error:', err.message);

      // Try to parse as regular JSON as fallback
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    }
  }

  /**
   * Check if compression is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get compression threshold
   */
  getThreshold(): number {
    return this.threshold;
  }

  /**
   * 🔥 TYPE-SAFE: Get compression stats using interface
   */
  getStats(): CacheCompressionStats {
    return {
      enabled: this.enabled,
      threshold: this.threshold,
      thresholdFormatted: `${(this.threshold / 1024).toFixed(2)} KB`,
    };
  }
}
