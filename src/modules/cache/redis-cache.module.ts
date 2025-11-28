import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';

import { RedisCacheService } from './redis-cache.service';
import { CacheCompressionService } from './cache-compression.service';
import { CacheWarmingService } from './cache-warming.service';
import { CacheController } from './cache.controller';

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  tls?: Record<string, unknown>;
  db?: number;
  keyPrefix?: string;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

@Global()
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [CacheController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService): Promise<Redis> => {
        console.log('🔧 Initializing Redis Client for Upstash...');

        const redisUrl = configService.get<string>('REDIS_URL');

        let client: Redis;

        // Option 1: Connect using URL (Upstash format)
        if (redisUrl) {
          console.log('   Using REDIS_URL connection');
          client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
            retryStrategy: (times: number): number => {
              const delay = Math.min(times * 50, 2000);
              console.log(
                `⚠️  Redis retry attempt ${times}, delay: ${delay}ms`,
              );
              return delay;
            },
          });
        }
        // Option 2: Connect using individual config
        else {
          const config: RedisConfig = {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD'),
            tls: configService.get<boolean>('REDIS_TLS') ? {} : undefined,
            db: configService.get<number>('REDIS_DB', 0),
          };

          console.log(`   Using config: ${config.host}:${config.port}`);

          client = new Redis({
            ...config,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
            retryStrategy: (times: number): number => {
              const delay = Math.min(times * 50, 2000);
              console.log(
                `⚠️  Redis retry attempt ${times}, delay: ${delay}ms`,
              );
              return delay;
            },
          });
        }

        // Event listeners
        client.on('connect', (): void => {
          console.log('✅ Redis Client: Connected');
        });

        client.on('ready', (): void => {
          console.log('✅ Redis Client: Ready');
        });

        client.on('error', (err: Error): void => {
          console.error('❌ Redis Client Error:', err.message);
        });

        client.on('close', (): void => {
          console.log('⚠️  Redis Client: Connection Closed');
        });

        client.on('reconnecting', (): void => {
          console.log('🔄 Redis Client: Reconnecting...');
        });

        // Test connection
        try {
          await client.ping();
          console.log(
            '✅ Redis PING successful - Upstash connection established',
          );
        } catch (error) {
          const err = error as Error;
          console.error('❌ Redis connection failed:', err.message);
          throw error;
        }

        return client;
      },
      inject: [ConfigService],
    },

    CacheCompressionService,
    RedisCacheService,
    CacheWarmingService,
  ],
  exports: [RedisCacheService, CacheCompressionService, CacheWarmingService],
})
export class RedisCacheModule {}
