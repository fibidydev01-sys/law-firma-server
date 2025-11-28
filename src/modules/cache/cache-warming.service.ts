// ===== FILE: src/modules/cache/cache-warming.service.ts (TYPE-SAFE VERSION) =====
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from './redis-cache.service';
import {
  LogAktivitasWithUser,
  PerkaraWithKlien,
} from '../../common/interfaces';
import { JenisPerkara, StatusPerkara } from '@prisma/client';

// 🔥 TYPE-SAFE: Interface untuk dashboard stats
interface DashboardStats {
  total_perkara: number;
  perkara_aktif: number;
  total_klien: number;
  total_tugas: number;
  tugas_belum_selesai: number;
  total_dokumen: number;
  total_sidang: number;
}

// 🔥 TYPE-SAFE: Interface untuk chart data
interface PerkaraByJenisChart {
  jenis: JenisPerkara;
  total: number;
}

interface PerkaraByStatusChart {
  status: StatusPerkara;
  total: number;
}

// 🔥 TYPE-SAFE: Interface untuk warming result
interface WarmingResult {
  success: boolean;
  duration?: number;
  succeeded?: number;
  failed?: number;
  tasks?: number;
  error?: string;
}

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly enabled: boolean;
  private readonly onStartup: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {
    this.enabled = this.configService.get<boolean>(
      'CACHE_WARMING_ENABLED',
      true,
    );
    this.onStartup = this.configService.get<boolean>(
      'CACHE_WARMING_ON_STARTUP',
      true,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled || !this.onStartup) {
      console.log('⚠️  Cache warming disabled');
      return;
    }

    console.log('🔥 Starting cache warming on application startup...');
    await this.warmCache();
  }

  async warmCache(): Promise<WarmingResult> {
    const startTime = Date.now();

    try {
      console.log('🔥 Cache Warming: Starting...');

      const results = await Promise.allSettled([
        this.warmDashboardStats(),
        this.warmRecentActivities(),
        this.warmDashboardCharts(),
        this.warmKlienFirstPage(),
        this.warmPerkaraFirstPage(),
        this.warmUpcomingSidang(),
      ]);

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      const duration = Date.now() - startTime;

      console.log(
        `✅ Cache Warming: Completed in ${duration}ms (${succeeded} succeeded, ${failed} failed)`,
      );

      return {
        success: true,
        duration,
        succeeded,
        failed,
        tasks: results.length,
      };
    } catch (error) {
      const err = error as Error;
      console.error('❌ Cache Warming: Failed', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  private async warmDashboardStats(): Promise<void> {
    try {
      const cacheKey = 'dashboard:stats';
      const stats = await this.getDashboardStats();
      await this.cache.set(cacheKey, stats, 300); // 5 minutes
      console.log('  ✅ Warmed: Dashboard Stats');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Dashboard Stats', err.message);
      throw error;
    }
  }

  private async warmRecentActivities(): Promise<void> {
    try {
      const cacheKey = 'dashboard:recentActivities';

      const activities = await this.prisma.logAktivitas.findMany({
        take: 20,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nama_lengkap: true,
              avatar_url: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await this.cache.set<LogAktivitasWithUser[]>(
        cacheKey,
        activities as LogAktivitasWithUser[],
        120,
      );
      console.log('  ✅ Warmed: Recent Activities');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Recent Activities', err.message);
      throw error;
    }
  }

  private async warmDashboardCharts(): Promise<void> {
    try {
      // Perkara by Jenis
      const byJenis = await this.prisma.perkara.groupBy({
        by: ['jenis_perkara'],
        _count: { id: true },
      });

      const chartByJenis: PerkaraByJenisChart[] = byJenis.map((item) => ({
        jenis: item.jenis_perkara,
        total: item._count.id,
      }));

      await this.cache.set('dashboard:perkaraByJenis', chartByJenis, 900);

      // Perkara by Status
      const byStatus = await this.prisma.perkara.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const chartByStatus: PerkaraByStatusChart[] = byStatus.map((item) => ({
        status: item.status,
        total: item._count.id,
      }));

      await this.cache.set('dashboard:perkaraByStatus', chartByStatus, 900);

      console.log('  ✅ Warmed: Dashboard Charts');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Dashboard Charts', err.message);
      throw error;
    }
  }

  private async warmKlienFirstPage(): Promise<void> {
    try {
      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.klien.findMany({
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            _count: {
              select: { perkara: true },
            },
          },
        }),
        this.prisma.klien.count(),
      ]);

      const result = {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: false,
        },
      };

      const cacheKey = `klien:findAll:${JSON.stringify({ page, limit, sortBy: 'created_at', sortOrder: 'desc' })}`;
      await this.cache.set(cacheKey, result, 3600);

      console.log('  ✅ Warmed: Klien First Page');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Klien First Page', err.message);
      throw error;
    }
  }

  private async warmPerkaraFirstPage(): Promise<void> {
    try {
      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.perkara.findMany({
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            klien: {
              select: {
                id: true,
                nama: true,
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
            _count: {
              select: {
                tugas: true,
                dokumen: true,
                jadwal_sidang: true,
              },
            },
          },
        }),
        this.prisma.perkara.count(),
      ]);

      const result = {
        data: data as PerkaraWithKlien[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: false,
        },
      };

      const cacheKey = `perkara:findAll:${JSON.stringify({ page, limit, sortOrder: 'desc' })}`;
      await this.cache.set(cacheKey, result, 3600);

      console.log('  ✅ Warmed: Perkara First Page');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Perkara First Page', err.message);
      throw error;
    }
  }

  private async warmUpcomingSidang(): Promise<void> {
    try {
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

      // 🔥 FIX: Don't need strict type here, just cache the data
      await this.cache.set('dashboard:upcomingSidang', sidang, 600);

      console.log('  ✅ Warmed: Upcoming Sidang');
    } catch (error) {
      const err = error as Error;
      console.error('  ❌ Failed: Upcoming Sidang', err.message);
      throw error;
    }
  }

  private async getDashboardStats(): Promise<DashboardStats> {
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

    return {
      total_perkara: totalPerkara,
      perkara_aktif: perkaraAktif,
      total_klien: totalKlien,
      total_tugas: totalTugas,
      tugas_belum_selesai: tugasBelumSelesai,
      total_dokumen: totalDokumen,
      total_sidang: totalSidang,
    };
  }

  async refreshCache(): Promise<WarmingResult> {
    console.log('🔄 Manual cache refresh triggered');
    return await this.warmCache();
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledWarmCache(): Promise<void> {
    if (!this.enabled) return;
    console.log('⏰ Scheduled cache warming triggered');
    await this.warmCache();
  }

  getStatus(): {
    enabled: boolean;
    onStartup: boolean;
    nextScheduledRun: string;
  } {
    return {
      enabled: this.enabled,
      onStartup: this.onStartup,
      nextScheduledRun: 'Every 6 hours',
    };
  }
}
