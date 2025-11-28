// ===== FILE: server/src/modules/klien/klien.service.ts (UPDATED) =====
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreateKlienDto } from './dto/create-klien.dto';
import { UpdateKlienDto } from './dto/update-klien.dto';
import { QueryKlienDto } from './dto/query-klien.dto';
import {
  PaginatedResult,
  KlienWithCount,
  KlienWithPerkara,
  CreateLogAktivitasData,
} from '../../common/interfaces';

@Injectable()
export class KlienService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  // ============================================================================
  // ✅ NEW: Method untuk client lihat profile sendiri
  // ============================================================================
  async getMyProfile(userId: string): Promise<KlienWithPerkara> {
    const cacheKey = `klien:profile:${userId}`;

    // Try cache first
    const cached = await this.cache.get<KlienWithPerkara>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - query database
    const klien = await this.prisma.klien.findUnique({
      where: { id: userId },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            jenis_perkara: true,
            status: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        _count: {
          select: { perkara: true },
        },
      },
    });

    if (!klien) {
      throw new NotFoundException('Profile klien tidak ditemukan');
    }

    // Cache result (30 minutes)
    await this.cache.set(cacheKey, klien, 1800);

    return klien;
  }

  // ============================================================================
  // ✅ NEW: Method untuk client update profile sendiri
  // ============================================================================
  async updateMyProfile(
    userId: string,
    dto: UpdateKlienDto,
  ): Promise<KlienWithCount> {
    // Cek apakah klien exists
    const existingKlien = await this.prisma.klien.findUnique({
      where: { id: userId },
    });

    if (!existingKlien) {
      throw new NotFoundException('Profile klien tidak ditemukan');
    }

    const updateData: Prisma.KlienUpdateInput = { ...dto };

    const klien = await this.prisma.klien.update({
      where: { id: userId },
      data: updateData,
      include: {
        _count: {
          select: { perkara: true },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_MY_PROFILE',
      jenis_entitas: 'klien',
      id_entitas: klien.id,
      detail: { nama: klien.nama },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // Invalidate cache
    await this.cache.del(`klien:profile:${userId}`);
    await this.cache.del(`klien:findOne:${JSON.stringify({ id: userId })}`);

    return klien;
  }

  // ============================================================================
  // 🔒 EXISTING: Method untuk admin/advokat/staff
  // ============================================================================
  private getCacheKey(
    method: string,
    params?: Record<string, unknown>,
  ): string {
    if (!params) return `klien:${method}`;
    return `klien:${method}:${JSON.stringify(params)}`;
  }

  async findAll(
    query: QueryKlienDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<KlienWithCount>> {
    // 🔥 RBAC: BLOCK ACCESS FOR CLIENT ROLE
    if (userRole === UserRole.klien) {
      throw new ForbiddenException(
        'Klien tidak dapat mengakses data klien lain. Gunakan endpoint /klien/profile untuk melihat data Anda.',
      );
    }

    // ADMIN, PARTNER, ADVOKAT, PARALEGAL, STAFF: Full access allowed
    const {
      page = 1,
      limit = 10,
      search,
      jenis_klien,
      kota,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const cacheKey = this.getCacheKey('findAll', {
      page,
      limit,
      search,
      jenis_klien,
      kota,
      sortBy,
      sortOrder,
    });

    // Try cache first
    const cached =
      await this.cache.get<PaginatedResult<KlienWithCount>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - query database
    const skip = (page - 1) * limit;
    const where: Prisma.KlienWhereInput = {};

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telepon: { contains: search, mode: 'insensitive' } },
        { nama_perusahaan: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (jenis_klien) {
      where.jenis_klien = jenis_klien;
    }

    if (kota) {
      where.kota = { contains: kota, mode: 'insensitive' };
    }

    const orderBy: Prisma.KlienOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.klien.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { perkara: true },
          },
        },
      }),
      this.prisma.klien.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const result: PaginatedResult<KlienWithCount> = {
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

    // Cache result (1 hour)
    await this.cache.set(cacheKey, result, 3600);

    return result;
  }

  async findOne(id: string): Promise<KlienWithPerkara> {
    const cacheKey = this.getCacheKey('findOne', { id });

    const cached = await this.cache.get<KlienWithPerkara>(cacheKey);
    if (cached) {
      return cached;
    }

    const klien = await this.prisma.klien.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            jenis_perkara: true,
            status: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        _count: {
          select: { perkara: true },
        },
      },
    });

    if (!klien) {
      throw new NotFoundException('Klien tidak ditemukan');
    }

    await this.cache.set(cacheKey, klien, 1800);

    return klien;
  }

  async create(dto: CreateKlienDto, userId: string): Promise<KlienWithCount> {
    const klien = await this.prisma.klien.create({
      data: {
        ...dto,
        dibuat_oleh: userId,
      },
      include: {
        _count: {
          select: { perkara: true },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'CREATE_KLIEN',
      jenis_entitas: 'klien',
      id_entitas: klien.id,
      detail: { nama: klien.nama },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.cache.delPattern('klien:findAll:*');

    return klien;
  }

  async update(
    id: string,
    dto: UpdateKlienDto,
    userId: string,
  ): Promise<KlienWithCount> {
    await this.findOne(id);

    const updateData: Prisma.KlienUpdateInput = { ...dto };

    const klien = await this.prisma.klien.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { perkara: true },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_KLIEN',
      jenis_entitas: 'klien',
      id_entitas: klien.id,
      detail: { nama: klien.nama },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.cache.del(this.getCacheKey('findOne', { id }));
    await this.cache.delPattern('klien:findAll:*');

    return klien;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const klien = await this.findOne(id);

    await this.prisma.klien.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_KLIEN',
      jenis_entitas: 'klien',
      id_entitas: id,
      detail: { nama: klien.nama },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.cache.del(this.getCacheKey('findOne', { id }));
    await this.cache.delPattern('klien:findAll:*');

    return { message: 'Klien berhasil dihapus' };
  }
}
