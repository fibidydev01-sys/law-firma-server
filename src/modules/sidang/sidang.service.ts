// ============================================================================
// FILE: server/src/modules/sidang/sidang.service.ts - WITH RBAC FILTERING
// ✅ FIXED: Invalidate perkara cache after create/update/delete
// ============================================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerkaraService } from '../perkara/perkara.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreateSidangDto } from './dto/create-sidang.dto';
import { UpdateSidangDto } from './dto/update-sidang.dto';
import { QuerySidangDto } from './dto/query-sidang.dto';
import {
  PaginatedResult,
  JadwalSidangWithRelations,
  CreateLogAktivitasData,
} from '../../common/interfaces';

@Injectable()
export class SidangService {
  constructor(
    private prisma: PrismaService,
    private perkaraService: PerkaraService, // ✅ Inject to invalidate perkara cache
  ) {}

  async create(
    dto: CreateSidangDto,
    userId: string,
  ): Promise<JadwalSidangWithRelations> {
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
    });

    if (!perkara) {
      throw new BadRequestException('Perkara tidak ditemukan');
    }

    const sidang = await this.prisma.jadwalSidang.create({
      data: {
        ...dto,
        dibuat_oleh: userId,
      },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            klien: {
              select: {
                id: true,
                nama: true,
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pembuat: {
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

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'CREATE_JADWAL_SIDANG',
      jenis_entitas: 'jadwal_sidang',
      id_entitas: sidang.id,
      detail: {
        jenis_sidang: sidang.jenis_sidang,
        tanggal: sidang.tanggal_sidang,
        perkara_id: dto.perkara_id,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache so detail page shows new sidang
    await this.perkaraService.invalidatePerkaraCache(dto.perkara_id);

    return sidang;
  }

  // ============================================================================
  // ✅ RBAC FILTERING APPLIED HERE!
  // ============================================================================
  async findAll(
    query: QuerySidangDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<JadwalSidangWithRelations>> {
    const {
      page = 1,
      limit = 10,
      search,
      jenis_sidang,
      perkara_id,
      tanggal_dari,
      tanggal_sampai,
      sortBy = 'tanggal_sidang',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.JadwalSidangWhereInput = {};

    // 🔥 RBAC: DATA FILTERING BASED ON USER ROLE
    if (userRole === UserRole.klien) {
      // KLIEN: Hanya sidang dari perkara mereka
      where.perkara = { klien_id: userId };
    } else if (userRole === UserRole.advokat) {
      // ADVOKAT: Sidang dari perkara yang mereka handle (dibuat) atau di tim
      where.perkara = {
        OR: [
          { dibuat_oleh: userId },
          { tim_perkara: { some: { user_id: userId } } },
        ],
      };
    }
    // ADMIN, STAFF, PARALEGAL: Full access (no additional filter)

    // Apply search & filters
    if (search) {
      const searchCondition: Prisma.JadwalSidangWhereInput = {
        OR: [
          { nama_pengadilan: { contains: search, mode: 'insensitive' } },
          { nama_hakim: { contains: search, mode: 'insensitive' } },
          { agenda_sidang: { contains: search, mode: 'insensitive' } },
        ],
      };

      // Safe way to add to AND condition
      if (where.AND) {
        if (Array.isArray(where.AND)) {
          where.AND.push(searchCondition);
        } else {
          where.AND = [where.AND, searchCondition];
        }
      } else if (where.perkara) {
        where.AND = [searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    if (jenis_sidang) where.jenis_sidang = jenis_sidang;
    if (perkara_id) where.perkara_id = perkara_id;

    if (tanggal_dari || tanggal_sampai) {
      where.tanggal_sidang = {};
      if (tanggal_dari) where.tanggal_sidang.gte = new Date(tanggal_dari);
      if (tanggal_sampai) where.tanggal_sidang.lte = new Date(tanggal_sampai);
    }

    const orderBy: Prisma.JadwalSidangOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.jadwalSidang.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          perkara: {
            select: {
              id: true,
              nomor_perkara: true,
              judul: true,
              klien: {
                select: {
                  id: true,
                  nama: true,
                  email: true,
                  telepon: true,
                  jenis_klien: true,
                },
              },
            },
          },
          pembuat: {
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
      this.prisma.jadwalSidang.count({ where }),
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

  async getUpcoming(
    query: QuerySidangDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<JadwalSidangWithRelations>> {
    const now = new Date();
    return this.findAll(
      {
        ...query,
        tanggal_dari: now.toISOString(),
        sortBy: 'tanggal_sidang',
        sortOrder: 'asc',
      },
      userId,
      userRole,
    );
  }

  async findOne(id: string): Promise<JadwalSidangWithRelations> {
    const sidang = await this.prisma.jadwalSidang.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            klien: {
              select: {
                id: true,
                nama: true,
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pembuat: {
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

    if (!sidang) {
      throw new NotFoundException('Jadwal sidang tidak ditemukan');
    }

    return sidang;
  }

  async update(
    id: string,
    dto: UpdateSidangDto,
    userId: string,
  ): Promise<JadwalSidangWithRelations> {
    const existingSidang = await this.findOne(id);

    const updateData: Prisma.JadwalSidangUpdateInput = { ...dto };

    const sidang = await this.prisma.jadwalSidang.update({
      where: { id },
      data: updateData,
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            klien: {
              select: {
                id: true,
                nama: true,
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pembuat: {
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

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_JADWAL_SIDANG',
      jenis_entitas: 'jadwal_sidang',
      id_entitas: sidang.id,
      detail: { jenis_sidang: sidang.jenis_sidang },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(existingSidang.perkara.id);

    return sidang;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const sidang = await this.findOne(id);

    await this.prisma.jadwalSidang.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_JADWAL_SIDANG',
      jenis_entitas: 'jadwal_sidang',
      id_entitas: id,
      detail: { jenis_sidang: sidang.jenis_sidang },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(sidang.perkara.id);

    return { message: 'Jadwal sidang berhasil dihapus' };
  }
}
