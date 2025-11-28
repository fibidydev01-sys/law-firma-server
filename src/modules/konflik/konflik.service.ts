// ===== FILE: src/modules/konflik/konflik.service.ts (FIXED) =====
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateKonflikDto } from './dto/create-konflik.dto';
import { UpdateKonflikDto } from './dto/update-konflik.dto';
import { QueryKonflikDto } from './dto/query-konflik.dto';
import {
  PaginatedResult,
  KonflikWithRelations,
  CreateLogAktivitasData,
} from '../../common/interfaces';

@Injectable()
export class KonflikService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateKonflikDto,
    userId: string,
  ): Promise<KonflikWithRelations> {
    const konflik = await this.prisma.pemeriksaanKonflik.create({
      data: {
        ...dto,
        diperiksa_oleh: userId,
      },
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
        },
        pemeriksa: {
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
      aksi: 'CREATE_PEMERIKSAAN_KONFLIK',
      jenis_entitas: 'pemeriksaan_konflik',
      id_entitas: konflik.id,
      detail: {
        nama_klien: dto.nama_klien,
        pihak_lawan: dto.pihak_lawan,
        ada_konflik: konflik.ada_konflik,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return konflik;
  }

  async findAll(
    query: QueryKonflikDto,
  ): Promise<PaginatedResult<KonflikWithRelations>> {
    const {
      page = 1,
      limit = 10,
      search,
      ada_konflik,
      perkara_id,
      sortBy = 'tanggal_periksa',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanKonflikWhereInput = {};

    if (search) {
      where.OR = [
        { nama_klien: { contains: search, mode: 'insensitive' } },
        { pihak_lawan: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ada_konflik !== undefined) where.ada_konflik = ada_konflik;
    if (perkara_id) where.perkara_id = perkara_id;

    const orderBy: Prisma.PemeriksaanKonflikOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.pemeriksaanKonflik.findMany({
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
              jenis_perkara: true,
              status: true,
              created_at: true,
            },
          },
          pemeriksa: {
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
      this.prisma.pemeriksaanKonflik.count({ where }),
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

  async findOne(id: string): Promise<KonflikWithRelations> {
    const konflik = await this.prisma.pemeriksaanKonflik.findUnique({
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
        },
        pemeriksa: {
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

    if (!konflik) {
      throw new NotFoundException('Pemeriksaan konflik tidak ditemukan');
    }

    return konflik;
  }

  async update(
    id: string,
    dto: UpdateKonflikDto,
    userId: string,
  ): Promise<KonflikWithRelations> {
    await this.findOne(id);

    const updateData: Prisma.PemeriksaanKonflikUpdateInput = { ...dto };

    const konflik = await this.prisma.pemeriksaanKonflik.update({
      where: { id },
      data: updateData,
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
        },
        pemeriksa: {
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
      aksi: 'UPDATE_PEMERIKSAAN_KONFLIK',
      jenis_entitas: 'pemeriksaan_konflik',
      id_entitas: konflik.id,
      detail: { ada_konflik: konflik.ada_konflik },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return konflik;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.pemeriksaanKonflik.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_PEMERIKSAAN_KONFLIK',
      jenis_entitas: 'pemeriksaan_konflik',
      id_entitas: id,
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return { message: 'Pemeriksaan konflik berhasil dihapus' };
  }
}
