// ===== FILE: src/modules/log-aktivitas/log-aktivitas.service.ts (FIXED) =====
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { QueryLogDto } from './dto/query-log.dto';
import { PaginatedResult, LogAktivitasWithUser } from '../../common/interfaces';

export interface AuditLogData {
  user_id: string;
  user_role?: UserRole;
  aksi: string;
  jenis_entitas?: string;
  id_entitas?: string;
  detail?: Record<string, any>;
  permission_context?: {
    required_roles?: UserRole[];
    required_permissions?: string[];
    access_granted: boolean;
  };
}

@Injectable()
export class LogAktivitasService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create audit log with permission context
   * Enhanced logging with role and permission information
   */
  async log(data: AuditLogData): Promise<void> {
    const { user_id, user_role, permission_context, detail, ...rest } = data;

    // Enhance detail with permission context
    const enhancedDetail = {
      ...detail,
      ...(user_role && { user_role }),
      ...(permission_context && { permission_context }),
      timestamp: new Date().toISOString(),
    };

    await this.prisma.logAktivitas.create({
      data: {
        user_id,
        ...rest,
        detail: enhancedDetail,
      },
    });
  }

  /**
   * Create standard audit log (backward compatible)
   */
  async create(data: {
    user_id: string;
    aksi: string;
    jenis_entitas?: string;
    id_entitas?: string;
    detail?: Record<string, any>;
  }): Promise<void> {
    await this.prisma.logAktivitas.create({
      data,
    });
  }

  async findAll(
    query: QueryLogDto,
  ): Promise<PaginatedResult<LogAktivitasWithUser>> {
    const {
      page = 1,
      limit = 20,
      search,
      user_id,
      aksi,
      jenis_entitas,
      id_entitas,
      from_date,
      to_date,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.LogAktivitasWhereInput = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (aksi) {
      where.aksi = { contains: aksi, mode: 'insensitive' };
    }

    if (jenis_entitas) {
      where.jenis_entitas = jenis_entitas;
    }

    if (id_entitas) {
      where.id_entitas = id_entitas;
    }

    if (search) {
      where.OR = [
        { aksi: { contains: search, mode: 'insensitive' } },
        { jenis_entitas: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) {
        where.created_at.gte = new Date(from_date);
      }
      if (to_date) {
        where.created_at.lte = new Date(to_date);
      }
    }

    const orderBy: Prisma.LogAktivitasOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.logAktivitas.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nama_lengkap: true,
              role: true,
              avatar_url: true,
            },
          },
        },
      }),
      this.prisma.logAktivitas.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ✅ FIXED: Support pagination via query parameter
  async findByUser(
    userId: string,
    query?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<LogAktivitasWithUser> | LogAktivitasWithUser[]> {
    // Jika ada pagination query
    if (query?.page && query?.limit) {
      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.logAktivitas.findMany({
          where: { user_id: userId },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                nama_lengkap: true,
                role: true,
                avatar_url: true,
              },
            },
          },
        }),
        this.prisma.logAktivitas.count({ where: { user_id: userId } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    // Tanpa pagination (default 50 latest)
    return this.prisma.logAktivitas.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nama_lengkap: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async getActivityStatistics(userId?: string) {
    const where: Prisma.LogAktivitasWhereInput = userId
      ? { user_id: userId }
      : {};

    const [total, byAction, recentActivity] = await Promise.all([
      this.prisma.logAktivitas.count({ where }),
      this.prisma.logAktivitas.groupBy({
        by: ['aksi'],
        where,
        _count: { aksi: true },
        orderBy: { _count: { aksi: 'desc' } },
        take: 10,
      }),
      this.prisma.logAktivitas.count({
        where: {
          ...where,
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      by_action: byAction.map((item) => ({
        action: item.aksi,
        count: item._count.aksi,
      })),
      recent_24h: recentActivity,
    };
  }
}
