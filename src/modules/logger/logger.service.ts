// ===== FILE: src/modules/logger/logger.service.ts (FIXED STRINGIFICATION) =====
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import {
  HttpLogMetadata,
  DatabaseQueryLog,
  CacheOperationLog,
  BusinessEventLog,
  LogContext,
} from '../../common/interfaces';

// 🔥 TYPE-SAFE: Logger Config Interface
interface LoggerFileConfig {
  enabled: boolean;
  directory: string;
  maxSize: string;
  maxFiles: string;
}

interface LoggerConsoleConfig {
  enabled: boolean;
  colorize: boolean;
}

interface LoggerConfiguration {
  level: string;
  console: LoggerConsoleConfig;
  file: LoggerFileConfig;
  errorFile: LoggerFileConfig;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const logConfig = this.configService.get<LoggerConfiguration>('logger');

    if (!logConfig) {
      throw new Error('Logger configuration not found');
    }

    const transports: winston.transport[] = [];

    // Console Transport
    if (logConfig.console.enabled) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize({ all: logConfig.console.colorize }),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                // 🔥 FIXED: Proper context stringification
                const contextStr =
                  context && typeof context === 'string'
                    ? `[${context}]`
                    : context
                      ? `[${JSON.stringify(context)}]`
                      : '';

                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';

                return `${String(timestamp)} ${String(level)} ${contextStr} ${String(message)}${metaStr}`;
              },
            ),
          ),
        }),
      );
    }

    // File Transport (All logs)
    if (logConfig.file.enabled) {
      transports.push(
        new DailyRotateFile({
          dirname: logConfig.file.directory,
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: logConfig.file.maxSize,
          maxFiles: logConfig.file.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    // Error File Transport (Errors only)
    if (logConfig.errorFile.enabled) {
      transports.push(
        new DailyRotateFile({
          dirname: logConfig.errorFile.directory,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: logConfig.errorFile.maxSize,
          maxFiles: logConfig.errorFile.maxFiles,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logConfig.level,
      transports,
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // 🔥 TYPE-SAFE: Custom methods with proper interfaces
  http(message: string, meta?: HttpLogMetadata | LogContext): void {
    this.logger.http(message, meta);
  }

  logRequest(
    req: {
      method: string;
      originalUrl: string;
      ip: string;
      headers: Record<string, string | string[] | undefined>;
    },
    res: { statusCode: number },
    responseTime: number,
  ): void {
    const metadata: HttpLogMetadata = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
    };

    this.http('HTTP Request', metadata);
  }

  logError(error: Error, context?: string): void {
    this.error(error.message, error.stack, context);
  }

  logBusinessEvent(event: string, data: Record<string, unknown>): void {
    const eventLog: BusinessEventLog = {
      event,
      data,
      category: 'business',
    };

    this.logger.info('Business Event', eventLog);
  }

  logDatabaseQuery(query: string, duration: number, params?: unknown): void {
    const queryLog: DatabaseQueryLog = {
      query,
      duration: `${duration}ms`,
      params,
      category: 'database',
    };

    this.logger.debug('Database Query', queryLog);
  }

  logCacheOperation(
    operation: string,
    key: string,
    result: 'hit' | 'miss' | 'set' | 'del',
  ): void {
    const cacheLog: CacheOperationLog = {
      operation,
      key,
      result,
      category: 'cache',
    };

    this.logger.debug('Cache Operation', cacheLog);
  }
}
