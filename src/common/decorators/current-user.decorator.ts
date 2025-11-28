// ===== FILE: src/common/decorators/current-user.decorator.ts (TYPE-SAFE VERSION) =====
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../interfaces';

// 🔥 TYPE-SAFE: Interface untuk request dengan user
interface RequestWithUser {
  user?: UserPayload;
}

/**
 * 🔥 TYPE-SAFE: CurrentUser Decorator
 *
 * Usage:
 * - @CurrentUser() user: UserPayload - Get entire user object
 * - @CurrentUser('id') userId: string - Get specific property
 * - @CurrentUser('email') email: string - Get email
 *
 * @param data - Optional property name to extract from user
 * @returns User object or specific property
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof UserPayload | undefined,
    ctx: ExecutionContext,
  ): UserPayload | string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // If no data specified, return entire user object
    if (!data) {
      return user;
    }

    // If data specified, return that property
    return user?.[data];
  },
);
