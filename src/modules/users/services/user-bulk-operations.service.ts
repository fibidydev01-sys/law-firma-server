// ===== FILE: user-bulk-operations.service.ts =====
// Handles: Bulk delete users, bulk change role
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { BulkOperationResult } from '../../../common/interfaces/statistics.interface';

@Injectable()
export class UserBulkOperationsService {
  constructor(private prisma: PrismaService) {}

  async bulkDeleteUsers(
    userIds: string[],
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        if (userId === currentUserId) {
          result.failed++;
          result.errors.push({
            user_id: userId,
            email: 'self',
            reason: 'Cannot delete your own account',
          });
          continue;
        }

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, role: true },
        });

        if (!user) {
          result.failed++;
          result.errors.push({
            user_id: userId,
            email: 'unknown',
            reason: 'User not found',
          });
          continue;
        }

        if (user.role === 'admin') {
          const adminCount = await this.prisma.user.count({
            where: { role: 'admin' },
          });
          if (adminCount <= 1) {
            result.failed++;
            result.errors.push({
              user_id: userId,
              email: user.email,
              reason: 'Cannot delete the last admin user',
            });
            continue;
          }
        }

        await this.prisma.user.delete({ where: { id: userId } });

        await this.prisma.logAktivitas.create({
          data: {
            user_id: currentUserId,
            aksi: 'BULK_DELETE_USER',
            jenis_entitas: 'user',
            id_entitas: userId,
            detail: { email: user.email },
          },
        });

        result.success++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.failed++;
        result.errors.push({
          user_id: userId,
          email: 'unknown',
          reason: errorMessage,
        });
      }
    }

    console.log(
      `✅ Bulk delete completed: ${result.success} success, ${result.failed} failed`,
    );
    return result;
  }

  async bulkChangeRole(
    userIds: string[],
    role: UserRole,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, role: true },
        });

        if (!user) {
          result.failed++;
          result.errors.push({
            user_id: userId,
            email: 'unknown',
            reason: 'User not found',
          });
          continue;
        }

        if (user.role === 'admin' && role !== 'admin') {
          const adminCount = await this.prisma.user.count({
            where: { role: 'admin' },
          });
          if (adminCount <= 1) {
            result.failed++;
            result.errors.push({
              user_id: userId,
              email: user.email,
              reason: 'Cannot change role of the last admin',
            });
            continue;
          }
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: { role },
        });

        await this.prisma.logAktivitas.create({
          data: {
            user_id: currentUserId,
            aksi: 'BULK_CHANGE_ROLE',
            jenis_entitas: 'user',
            id_entitas: userId,
            detail: {
              email: user.email,
              old_role: user.role,
              new_role: role,
            },
          },
        });

        result.success++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.failed++;
        result.errors.push({
          user_id: userId,
          email: 'unknown',
          reason: errorMessage,
        });
      }
    }

    console.log(
      `✅ Bulk role change completed: ${result.success} success, ${result.failed} failed`,
    );
    return result;
  }
}
