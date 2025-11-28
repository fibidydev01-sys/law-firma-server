// ===== FILE: src/modules/monitoring/metrics.interceptor.ts (TYPE-SAFE VERSION) =====
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpMetrics } from './metrics/http.metrics';
import { CacheMetrics } from './metrics/cache.metrics';

// 🔥 TYPE-SAFE: Interface untuk Request dengan route
interface RequestWithRoute {
  method: string;
  route?: {
    path: string;
  };
}

// 🔥 TYPE-SAFE: Interface untuk Response
interface ResponseWithStatus {
  statusCode: number;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private httpMetrics: HttpMetrics,
    private cacheMetrics: CacheMetrics,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithRoute>();
    const response = context.switchToHttp().getResponse<ResponseWithStatus>();

    const { method, route } = request;
    const routePath = route?.path || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;

        // Record HTTP metrics
        this.httpMetrics.recordRequest(method, routePath, statusCode);
        this.httpMetrics.recordDuration(
          method,
          routePath,
          statusCode,
          duration,
        );
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;

        // 🔥 TYPE-SAFE: Handle different error types
        let statusCode = 500;
        let errorType = 'UnknownError';

        if (error instanceof HttpException) {
          statusCode = error.getStatus();
          errorType = error.constructor.name;
        } else if (error instanceof Error) {
          errorType = error.constructor.name;
        }

        // Record error metrics
        this.httpMetrics.recordError(method, routePath, statusCode, errorType);
        this.httpMetrics.recordDuration(
          method,
          routePath,
          statusCode,
          duration,
        );

        return throwError(() => error);
      }),
    );
  }
}
