// ===== FILE: src/config/app.config.ts (COMPLETE & OPTIMIZED) =====
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // ============================================================================
  // URLS
  // ============================================================================
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  webLayananUrl: process.env.WEB_LAYANAN_URL || 'http://localhost:3002',
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // ============================================================================
  // CORS - SUPPORT MULTIPLE FRONTENDS
  // ============================================================================
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [
      'http://localhost:3001', // Main Frontend
      'http://localhost:3002', // WEB-LAYANAN (Klien Upload)
      'http://localhost:5173', // Vite Dev Server
    ],

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10), // seconds
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // requests
  },

  // ============================================================================
  // FILE UPLOAD CONFIGURATION
  // ============================================================================
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedExtensions: process.env.ALLOWED_EXTENSIONS?.split(',').map((ext) =>
      ext.trim(),
    ) || ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain',
    ],
  },

  // ============================================================================
  // DEBUG FLAGS
  // ============================================================================
  debug: {
    enabled: process.env.DEBUG === 'true',
    prisma: process.env.DEBUG_PRISMA === 'true',
    redis: process.env.DEBUG_REDIS === 'true',
    cors: process.env.DEBUG_CORS === 'true',
    upload: process.env.DEBUG_UPLOAD === 'true',
  },

  // ============================================================================
  // TIMEZONE & LOCALE
  // ============================================================================
  timezone: process.env.TZ || 'Asia/Jakarta',
  locale: process.env.LOCALE || 'id-ID',

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================
  features: {
    seedOnStartup: process.env.SEED_ON_STARTUP === 'true',
    swaggerEnabled: process.env.NODE_ENV !== 'production',
    bulkUpload: process.env.FEATURE_BULK_UPLOAD !== 'false',
    googleDrive: process.env.FEATURE_GOOGLE_DRIVE !== 'false',
    cacheWarming: process.env.CACHE_WARMING_ENABLED === 'true',
    cacheCompression: process.env.CACHE_COMPRESSION_ENABLED === 'true',
  },

  // ============================================================================
  // SECURITY
  // ============================================================================
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  },

  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE === 'true',
    directory: process.env.LOG_DIRECTORY || './logs',
  },
}));