// ============================================================================
// FILE: src/modules/dashboard/dashboard.service.ts
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Prisma } from '@prisma/client';

/**
 * ✅ FIX: EXPORT semua type definitions
 */

export interface DashboardStats {
  total_perkara: number;
  perkara_aktif: number;
  total_klien: number;
  total_tugas: number;
  tugas_belum_selesai: number;
  total_dokumen: number;
  total_sidang: number;
}

export interface RecentActivity {
  id: string;
  user_id: string | null;
  aksi: string;
  jenis_entitas: string | null;
  id_entitas: string | null;
  detail: Prisma.InputJsonValue | null; // ✅ CHANGED
  created_at: Date;
  user: {
    id: string;
    nama_lengkap: string | null;
    avatar_url: string | null;
  } | null;
}

export interface UserStats {
  my_total_tugas: number;
  my_tugas_belum_selesai: number;
  my_perkara_as_team: number;
}

export interface UpcomingSidang {
  id: string;
  perkara_id: string;
  jenis_sidang: string;
  tanggal_sidang: Date;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  nama_pengadilan: string;
  nomor_ruang_sidang: string | null;
  nama_hakim: string | null;
  lokasi_lengkap: string | null;
  agenda_sidang: string | null;
  hasil_sidang: string | null;
  putusan: string | null;
  catatan: string | null;
  dibuat_oleh: string | null;
  created_at: Date;
  updated_at: Date;
  perkara: {
    id: string;
    nomor_perkara: string;
    judul: string;
    klien: {
      id: string;
      nama: string;
    } | null;
  };
}

export interface ChartDataItem {
  jenis: string;
  total: number;
}

export interface StatusChartDataItem {
  status: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  private getCacheKey(
    method: string,
    params?: Record<string, unknown>,
  ): string {
    if (!params) return `dashboard:${method}`;
    return `dashboard:${method}:${JSON.stringify(params)}`;
  }

  async getStats(): Promise<DashboardStats> {
    const cacheKey = this.getCacheKey('stats');

    const cached = await this.cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    const [
      totalPerkara,
      perkaraAktif,
      totalKlien,
      totalTugas,
      tugasBelumSelesai,
      totalDokumen,
      totalSidang,
    ] = await Promise.all([
      this.prisma.perkara.count(),
      this.prisma.perkara.count({ where: { status: 'aktif' } }),
      this.prisma.klien.count(),
      this.prisma.tugas.count(),
      this.prisma.tugas.count({
        where: {
          status: { in: ['belum_mulai', 'sedang_berjalan'] },
        },
      }),
      this.prisma.dokumenHukum.count(),
      this.prisma.jadwalSidang.count(),
    ]);

    const result: DashboardStats = {
      total_perkara: totalPerkara,
      perkara_aktif: perkaraAktif,
      total_klien: totalKlien,
      total_tugas: totalTugas,
      tugas_belum_selesai: tugasBelumSelesai,
      total_dokumen: totalDokumen,
      total_sidang: totalSidang,
    };

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    const cacheKey = this.getCacheKey('recentActivities');

    const cached = await this.cache.get<RecentActivity[]>(cacheKey);
    if (cached) return cached;

    const activities = await this.prisma.logAktivitas.findMany({
      take: 20,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nama_lengkap: true,
            avatar_url: true,
          },
        },
      },
    });

    await this.cache.set(cacheKey, activities, 120);
    return activities;
  }

  async getMyStats(userId: string): Promise<UserStats> {
    const cacheKey = this.getCacheKey('myStats', { userId });

    const cached = await this.cache.get<UserStats>(cacheKey);
    if (cached) return cached;

    const [myTotalTugas, myTugasBelumSelesai, myPerkaraAsTeam] =
      await Promise.all([
        this.prisma.tugas.count({ where: { ditugaskan_ke: userId } }),
        this.prisma.tugas.count({
          where: {
            ditugaskan_ke: userId,
            status: { in: ['belum_mulai', 'sedang_berjalan'] },
          },
        }),
        this.prisma.timPerkara.count({ where: { user_id: userId } }),
      ]);

    const result: UserStats = {
      my_total_tugas: myTotalTugas,
      my_tugas_belum_selesai: myTugasBelumSelesai,
      my_perkara_as_team: myPerkaraAsTeam,
    };

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async getUpcomingSidang(): Promise<UpcomingSidang[]> {
    const cacheKey = this.getCacheKey('upcomingSidang');

    const cached = await this.cache.get<UpcomingSidang[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const sidang = await this.prisma.jadwalSidang.findMany({
      where: {
        tanggal_sidang: { gte: now },
      },
      take: 10,
      orderBy: { tanggal_sidang: 'asc' },
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
              },
            },
          },
        },
      },
    });

    await this.cache.set(cacheKey, sidang, 600);
    return sidang;
  }

  async getPerkaraByJenisChart(): Promise<ChartDataItem[]> {
    const cacheKey = this.getCacheKey('perkaraByJenis');

    const cached = await this.cache.get<ChartDataItem[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.perkara.groupBy({
      by: ['jenis_perkara'],
      _count: { id: true },
    });

    const result: ChartDataItem[] = data.map((item) => ({
      jenis: item.jenis_perkara,
      total: item._count.id,
    }));

    await this.cache.set(cacheKey, result, 900);
    return result;
  }

  async getPerkaraByStatusChart(): Promise<StatusChartDataItem[]> {
    const cacheKey = this.getCacheKey('perkaraByStatus');

    const cached = await this.cache.get<StatusChartDataItem[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.perkara.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const result: StatusChartDataItem[] = data.map((item) => ({
      status: item.status,
      total: item._count.id,
    }));

    await this.cache.set(cacheKey, result, 900);
    return result;
  }
}
