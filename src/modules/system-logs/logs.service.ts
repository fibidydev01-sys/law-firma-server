// ===== FILE: src/modules/logs/logs.service.ts (TYPE-SAFE VERSION) =====
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import {
  PaginatedResult,
  LogAktivitasWithUser,
  PrismaWhereClause,
  PrismaOrderBy,
} from '../../common/interfaces';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: QueryLogsDto,
  ): Promise<PaginatedResult<LogAktivitasWithUser>> {
    const {
      page = 1,
      limit = 10,
      search,
      aksi,
      jenis_entitas,
      user_id,
      tanggal_dari,
      tanggal_sampai,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // 🔥 TYPE-SAFE: Gunakan PrismaWhereClause
    const where: PrismaWhereClause = {};

    if (search) {
      where.OR = [
        { aksi: { contains: search, mode: 'insensitive' } },
        { jenis_entitas: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (aksi) where.aksi = aksi;
    if (jenis_entitas) where.jenis_entitas = jenis_entitas;
    if (user_id) where.user_id = user_id;

    if (tanggal_dari || tanggal_sampai) {
      where.created_at = {
        ...(tanggal_dari && { gte: new Date(tanggal_dari) }),
        ...(tanggal_sampai && { lte: new Date(tanggal_sampai) }),
      };
    }

    // 🔥 TYPE-SAFE: Gunakan PrismaOrderBy
    const orderBy: PrismaOrderBy = { [sortBy]: sortOrder };

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
              nama_lengkap: true,
              email: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.logAktivitas.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as LogAktivitasWithUser[], // Cast to proper type
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

  async findOne(id: string): Promise<LogAktivitasWithUser> {
    const log = await this.prisma.logAktivitas.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log aktivitas tidak ditemukan');
    }

    return log as LogAktivitasWithUser;
  }

  async getMyActivities(
    userId: string,
    query: QueryLogsDto,
  ): Promise<PaginatedResult<LogAktivitasWithUser>> {
    return this.findAll({ ...query, user_id: userId });
  }

  async cleanup(): Promise<{
    message: string;
    deleted_count: number;
  }> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.logAktivitas.deleteMany({
      where: {
        created_at: { lt: ninetyDaysAgo },
      },
    });

    return {
      message: `Berhasil menghapus ${result.count} log aktivitas lama`,
      deleted_count: result.count,
    };
  }
}
