// ===== FILE: src/modules/logger/logger.interceptor.ts (TYPE-SAFE VERSION) =====
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

// 🔥 TYPE-SAFE: Interfaces untuk Request dan Response
interface LoggableRequest {
  method: string;
  originalUrl: string;
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}

interface LoggableResponse {
  statusCode: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<LoggableRequest>();
    const response = context.switchToHttp().getResponse<LoggableResponse>();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;

        // 🔥 TYPE-SAFE: Pass properly typed objects to logger
        this.logger.logRequest(request, response, responseTime);
      }),
    );
  }
}
