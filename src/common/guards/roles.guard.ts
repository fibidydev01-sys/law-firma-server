// ===== FILE: src/common/guards/roles.guard.ts (TYPE-SAFE) =====
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // 🔥 TYPE-SAFE: Use AuthenticatedRequest interface
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // User must exist and have a role
    if (!user || !user.role) {
      return false;
    }

    // ✅ ADMIN BYPASS - ADMIN can access ALL endpoints
    if (user.role === UserRole.admin) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
