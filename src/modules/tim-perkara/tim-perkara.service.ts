// ============================================================================
// FILE: server/src/modules/tim-perkara/tim-perkara.service.ts
// ✅ FIXED: Use PerkaraService to invalidate cache
// ============================================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTimPerkaraDto } from './dto/create-tim-perkara.dto';
import { UpdateTimPerkaraDto } from './dto/update-tim-perkara.dto';
import { QueryTimPerkaraDto } from './dto/query-tim-perkara.dto';
import {
  PaginatedResult,
  TimPerkaraWithRelations,
  CreateLogAktivitasData,
} from '../../common/interfaces';

// ✅ Import PerkaraService
import { PerkaraService } from '../perkara/perkara.service';

@Injectable()
export class TimPerkaraService {
  constructor(
    private prisma: PrismaService,
    // ✅ Inject PerkaraService (NO CIRCULAR DEPENDENCY)
    private perkaraService: PerkaraService,
  ) {}

  async create(
    dto: CreateTimPerkaraDto,
    currentUserId: string,
  ): Promise<TimPerkaraWithRelations> {
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
    });

    if (!perkara) {
      throw new BadRequestException('Perkara tidak ditemukan');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.user_id },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    const existing = await this.prisma.timPerkara.findFirst({
      where: {
        perkara_id: dto.perkara_id,
        user_id: dto.user_id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'User sudah tergabung dalam tim perkara ini',
      );
    }

    const timPerkara = await this.prisma.timPerkara.create({
      data: dto,
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            status: true,
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
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: currentUserId,
      aksi: 'ADD_TIM_PERKARA',
      jenis_entitas: 'tim_perkara',
      id_entitas: timPerkara.id,
      detail: {
        perkara_id: dto.perkara_id,
        user_id: dto.user_id,
        peran: dto.peran,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ Panggil PerkaraService untuk invalidate cache
    await this.perkaraService.invalidatePerkaraCache(dto.perkara_id);

    return timPerkara;
  }

  async findAll(
    query: QueryTimPerkaraDto,
  ): Promise<PaginatedResult<TimPerkaraWithRelations>> {
    const {
      page = 1,
      limit = 10,
      search,
      perkara_id,
      user_id,
      sortBy = 'tanggal_ditugaskan',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TimPerkaraWhereInput = {};

    if (search) {
      where.OR = [{ peran: { contains: search, mode: 'insensitive' } }];
    }

    if (perkara_id) where.perkara_id = perkara_id;
    if (user_id) where.user_id = user_id;

    const orderBy: Prisma.TimPerkaraOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.timPerkara.findMany({
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
              status: true,
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
          user: {
            select: {
              id: true,
              nama_lengkap: true,
              email: true,
              jabatan: true,
              avatar_url: true,
              telepon: true,
            },
          },
        },
      }),
      this.prisma.timPerkara.count({ where }),
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

  async findOne(id: string): Promise<TimPerkaraWithRelations> {
    const timPerkara = await this.prisma.timPerkara.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            status: true,
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
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
      },
    });

    if (!timPerkara) {
      throw new NotFoundException('Tim perkara tidak ditemukan');
    }

    return timPerkara;
  }

  async findByPerkara(perkaraId: string): Promise<TimPerkaraWithRelations[]> {
    const team = await this.prisma.timPerkara.findMany({
      where: { perkara_id: perkaraId },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            status: true,
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
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
      },
      orderBy: { tanggal_ditugaskan: 'asc' },
    });

    return team;
  }

  async findByUser(userId: string): Promise<TimPerkaraWithRelations[]> {
    const perkara = await this.prisma.timPerkara.findMany({
      where: { user_id: userId },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            status: true,
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
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
      },
      orderBy: { tanggal_ditugaskan: 'desc' },
    });

    return perkara;
  }

  async update(
    id: string,
    dto: UpdateTimPerkaraDto,
    currentUserId: string,
  ): Promise<TimPerkaraWithRelations> {
    console.log('📝 Updating tim member:', id);

    const existing = await this.findOne(id);
    console.log('📋 Tim member found:', {
      id: existing.id,
      perkara_id: existing.perkara_id,
      user_id: existing.user_id,
      current_peran: existing.peran,
    });

    const timPerkara = await this.prisma.timPerkara.update({
      where: { id },
      data: {
        peran: dto.peran,
      },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            status: true,
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
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
      },
    });

    console.log('✅ Tim member updated successfully');

    const logData: CreateLogAktivitasData = {
      user_id: currentUserId,
      aksi: 'UPDATE_TIM_PERKARA',
      jenis_entitas: 'tim_perkara',
      id_entitas: id,
      detail: {
        perkara_id: timPerkara.perkara_id,
        user_id: timPerkara.user_id,
        old_peran: existing.peran,
        new_peran: dto.peran,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ Panggil PerkaraService untuk invalidate cache
    await this.perkaraService.invalidatePerkaraCache(timPerkara.perkara_id);

    return timPerkara;
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    console.log('🗑️ Removing tim member:', id);

    const timPerkara = await this.findOne(id);
    console.log('📋 Tim member found:', {
      id: timPerkara.id,
      perkara_id: timPerkara.perkara_id,
      user_id: timPerkara.user_id,
    });

    await this.prisma.timPerkara.delete({
      where: { id },
    });
    console.log('✅ Deleted from database');

    // ✅ Panggil PerkaraService untuk invalidate cache
    await this.perkaraService.invalidatePerkaraCache(timPerkara.perkara_id);

    const logData: CreateLogAktivitasData = {
      user_id: currentUserId,
      aksi: 'REMOVE_TIM_PERKARA',
      jenis_entitas: 'tim_perkara',
      id_entitas: id,
      detail: {
        perkara_id: timPerkara.perkara_id,
        user_id: timPerkara.user_id,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return { message: 'Anggota tim perkara berhasil dihapus' };
  }
}
