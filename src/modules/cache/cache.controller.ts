// ===== FILE: src/modules/cache/cache.controller.ts (TYPE-SAFE VERSION) =====
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { RedisCacheService } from './redis-cache.service';
import { CacheWarmingService } from './cache-warming.service';
import { CacheCompressionService } from './cache-compression.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { RedisStats, CacheCompressionStats } from '../../common/interfaces';

// 🔥 TYPE-SAFE: Response interfaces untuk controller
interface CacheStatusResponse {
  redis: {
    connected: boolean;
    info: string[];
  };
  compression: CacheCompressionStats;
  warming: {
    enabled: boolean;
    onStartup: boolean;
    nextScheduledRun: string;
  };
}

interface WarmCacheResponse {
  message: string;
  success: boolean;
  duration?: number;
  succeeded?: number;
  failed?: number;
  tasks?: number;
  error?: string;
}

interface FlushCacheResponse {
  message: string;
  warning: string;
}

interface CacheKeysResponse {
  total: number;
  keys: string[];
  note: string | null;
}

@ApiTags('Cache Management')
@ApiBearerAuth()
@Controller('cache')
@UseGuards(RolesGuard)
export class CacheController {
  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly warmingService: CacheWarmingService,
    private readonly compressionService: CacheCompressionService,
  ) {}

  @Get('status')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get cache system status' })
  @ApiResponse({ status: 200, description: 'Cache status retrieved' })
  async getStatus(): Promise<CacheStatusResponse> {
    const info = await this.cacheService.info();
    const ping = await this.cacheService.ping();

    return {
      redis: {
        connected: ping === 'PONG',
        info: info.split('\r\n').slice(0, 10), // First 10 lines
      },
      compression: this.cacheService.getCompressionStats(),
      warming: this.warmingService.getStatus(),
    };
  }

  @Post('warm')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Manually trigger cache warming' })
  @ApiResponse({ status: 200, description: 'Cache warming initiated' })
  async warmCache(): Promise<WarmCacheResponse> {
    const result = await this.warmingService.refreshCache();
    return {
      message: 'Cache warming completed',
      ...result,
    };
  }

  @Delete('flush')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Flush all cache (DANGER!)' })
  @ApiResponse({ status: 200, description: 'Cache flushed successfully' })
  async flushCache(): Promise<FlushCacheResponse> {
    await this.cacheService.flushDb();
    return {
      message: 'All cache has been flushed',
      warning: 'Cache will be rebuilt on next requests',
    };
  }

  @Get('keys')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get all cache keys' })
  @ApiResponse({ status: 200, description: 'Cache keys retrieved' })
  async getKeys(): Promise<CacheKeysResponse> {
    const keys = await this.cacheService.keys('*');
    return {
      total: keys.length,
      keys: keys.slice(0, 100), // Limit to first 100
      note: keys.length > 100 ? 'Showing first 100 keys only' : null,
    };
  }

  @Get('stats')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved' })
  async getStats(): Promise<
    RedisStats & { compression: CacheCompressionStats }
  > {
    const info = await this.cacheService.info();
    const keys = await this.cacheService.keys('*');

    // Parse Redis info
    const lines = info.split('\r\n');
    const statsMap: Record<string, string> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        statsMap[key] = value;
      }
    }

    // 🔥 TYPE-SAFE: Calculate hit rate safely
    const hits = parseInt(statsMap.keyspace_hits || '0', 10);
    const misses = parseInt(statsMap.keyspace_misses || '0', 10);
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : 'N/A';

    return {
      total_keys: keys.length,
      memory: {
        used: statsMap.used_memory_human || 'N/A',
        peak: statsMap.used_memory_peak_human || 'N/A',
        fragmentation_ratio: statsMap.mem_fragmentation_ratio || 'N/A',
      },
      hits_misses: {
        hits,
        misses,
        hit_rate: hitRate,
      },
      uptime: {
        seconds: parseInt(statsMap.uptime_in_seconds || '0', 10),
        days: (parseInt(statsMap.uptime_in_seconds || '0', 10) / 86400).toFixed(
          2,
        ),
      },
      compression: this.compressionService.getStats(),
    };
  }
}
