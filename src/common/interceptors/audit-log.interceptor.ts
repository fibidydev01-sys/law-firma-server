// ============================================================================
// FILE: src/common/interceptors/audit-log.interceptor.ts
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LogAktivitasService } from '../../modules/log-aktivitas/log-aktivitas.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: string;
  entity?: string;
}

/**
 * Decorator to mark endpoints for audit logging
 * @param action - Action being performed (e.g., 'CREATE_KLIEN', 'DELETE_PERKARA')
 * @param entity - Entity type (e.g., 'klien', 'perkara')
 */
export const AuditLog = (action: string, entity?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      AUDIT_LOG_KEY,
      { action, entity },
      descriptor.value,
    );
    return descriptor;
  };
};

/**
 * Interceptor that automatically logs permission-sensitive operations
 * Usage:
 * 1. Add @AuditLog('ACTION_NAME', 'entity_type') decorator to controller method
 * 2. Interceptor will automatically log with permission context
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogAktivitasService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // Skip if no audit metadata
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { action, entity } = auditMetadata;

    // Get required roles for permission context
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      tap(async (response) => {
        // Only log if user is authenticated
        if (!user?.id) {
          return;
        }

        // Extract entity ID from response if available
        let entityId: string | undefined;
        if (response && typeof response === 'object') {
          entityId = response.id || response.data?.id;
        }

        // Also check params for entity ID
        if (!entityId && request.params?.id) {
          entityId = request.params.id;
        }

        // Log the operation with permission context
        try {
          await this.logService.log({
            user_id: user.id,
            user_role: user.role,
            aksi: action,
            jenis_entitas: entity,
            id_entitas: entityId,
            detail: {
              method: request.method,
              url: request.url,
              ip: request.ip,
              user_agent: request.headers['user-agent'],
            },
            permission_context: {
              required_roles: requiredRoles,
              access_granted: true,
            },
          });
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }
}
