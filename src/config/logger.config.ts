// ===== FILE: src/config/logger.config.ts =====
import { registerAs } from '@nestjs/config';

export default registerAs('logger', () => ({
  // Log Levels
  level: process.env.LOG_LEVEL || 'info',

  // Console Output
  console: {
    enabled: process.env.LOG_CONSOLE === 'true' || true,
    colorize: process.env.NODE_ENV !== 'production',
  },

  // File Output
  file: {
    enabled: process.env.LOG_FILE === 'true' || true,
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // Error File (separate)
  errorFile: {
    enabled: true,
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: '20m',
    maxFiles: '30d',
  },

  // External Service (e.g., LogDNA, Datadog)
  external: {
    enabled: process.env.LOG_EXTERNAL === 'true' || false,
    endpoint: process.env.LOG_EXTERNAL_ENDPOINT || '',
    apiKey: process.env.LOG_EXTERNAL_API_KEY || '',
  },

  // Request Logging
  http: {
    enabled: true,
    logBody: process.env.NODE_ENV !== 'production',
    logHeaders: false,
    excludePaths: ['/health', '/metrics'],
  },
}));
