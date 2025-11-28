// ============================================================================
// FILE: src/modules/logger/logger.middleware.ts
// ✅ FIX: Type-safe request handling
// ============================================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      // ✅ FIX: Create type-safe request object
      const safeRequest = {
        method: req.method,
        originalUrl: req.originalUrl || req.url,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        headers: req.headers as Record<string, string | string[] | undefined>,
      };

      this.logger.logRequest(safeRequest, res, responseTime);
    });

    next();
  }
}
