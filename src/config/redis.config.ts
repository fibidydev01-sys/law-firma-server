// ===== UPDATED: Support Upstash Redis with TLS =====
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const redisUrl = process.env.REDIS_URL;

  // If REDIS_URL is provided (Upstash format), parse it
  if (redisUrl) {
    return {
      url: redisUrl,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'firma:',

      // Connection options
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };
  }

  // Fallback to individual config values
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'firma:',

    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };
});
