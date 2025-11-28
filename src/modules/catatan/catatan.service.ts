// ===== FILE: src/modules/catatan/catatan.service.ts (FIXED) =====
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCatatanDto } from './dto/create-catatan.dto';
import { UpdateCatatanDto } from './dto/update-catatan.dto';
import { QueryCatatanDto } from './dto/query-catatan.dto';
import {
  PaginatedResult,
  CatatanWithRelations,
  CreateLogAktivitasData,
} from '../../common/interfaces';

@Injectable()
export class CatatanService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateCatatanDto,
    userId: string,
  ): Promise<CatatanWithRelations> {
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
    });

    if (!perkara) {
      throw new NotFoundException('Perkara tidak ditemukan');
    }

    const catatan = await this.prisma.catatanPerkara.create({
      data: {
        ...dto,
        user_id: userId,
      },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
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

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'CREATE_CATATAN',
      jenis_entitas: 'catatan_perkara',
      id_entitas: catatan.id,
      detail: { perkara_id: dto.perkara_id },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return catatan;
  }

  async findAll(
    query: QueryCatatanDto,
  ): Promise<PaginatedResult<CatatanWithRelations>> {
    const {
      page = 1,
      limit = 10,
      search,
      perkara_id,
      user_id,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CatatanPerkaraWhereInput = {};

    if (search) {
      where.catatan = { contains: search, mode: 'insensitive' };
    }

    if (perkara_id) where.perkara_id = perkara_id;
    if (user_id) where.user_id = user_id;

    const orderBy: Prisma.CatatanPerkaraOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.catatanPerkara.findMany({
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
            },
          },
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
      this.prisma.catatanPerkara.count({ where }),
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

  async findOne(id: string): Promise<CatatanWithRelations> {
    const catatan = await this.prisma.catatanPerkara.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
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

    if (!catatan) {
      throw new NotFoundException('Catatan tidak ditemukan');
    }

    return catatan;
  }

  async update(
    id: string,
    dto: UpdateCatatanDto,
    userId: string,
  ): Promise<CatatanWithRelations> {
    const existing = await this.findOne(id);

    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk mengubah catatan ini',
      );
    }

    const updateData: Prisma.CatatanPerkaraUpdateInput = { ...dto };

    const catatan = await this.prisma.catatanPerkara.update({
      where: { id },
      data: updateData,
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
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

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_CATATAN',
      jenis_entitas: 'catatan_perkara',
      id_entitas: catatan.id,
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return catatan;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existing = await this.findOne(id);

    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk menghapus catatan ini',
      );
    }

    await this.prisma.catatanPerkara.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_CATATAN',
      jenis_entitas: 'catatan_perkara',
      id_entitas: id,
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return { message: 'Catatan berhasil dihapus' };
  }
}
