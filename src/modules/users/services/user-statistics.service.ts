// ===== FILE: user-statistics.service.ts =====
// Handles: Team statistics, workload distribution, analytics
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TeamStatistics,
  WorkloadDistribution,
} from '../../../common/interfaces/statistics.interface';

@Injectable()
export class UserStatisticsService {
  constructor(private prisma: PrismaService) {}

  async getTeamStatistics(): Promise<TeamStatistics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      total_users,
      adminCount,
      advokatCount,
      paralegalCount,
      staffCount,
      klienCount,
      active_users,
      inactive_users,
      recent_additions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'admin' } }),
      this.prisma.user.count({ where: { role: 'advokat' } }),
      this.prisma.user.count({ where: { role: 'paralegal' } }),
      this.prisma.user.count({ where: { role: 'staff' } }),
      this.prisma.user.count({ where: { role: 'klien' } }),
      this.prisma.user.count({ where: { is_active: true } }),
      this.prisma.user.count({ where: { is_active: false } }),
      this.prisma.user.count({
        where: { created_at: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      total_users,
      by_role: {
        admin: adminCount,
        advokat: advokatCount,
        paralegal: paralegalCount,
        staff: staffCount,
        klien: klienCount,
      },
      active_users,
      inactive_users,
      recent_additions,
      last_30_days: recent_additions,
    };
  }

  async getWorkloadDistribution(): Promise<WorkloadDistribution[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: ['advokat', 'paralegal', 'staff'] },
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        nama_lengkap: true,
        role: true,
        _count: {
          select: {
            perkara_dibuat: true,
            tugas_ditugaskan: true,
            dokumen_diunggah: true,
            tim_perkara: true,
          },
        },
      },
    });

    const distribution: WorkloadDistribution[] = await Promise.all(
      users.map(async (user) => {
        const pendingTugas = await this.prisma.tugas.count({
          where: {
            ditugaskan_ke: user.id,
            status: { in: ['belum_mulai', 'sedang_berjalan'] },
          },
        });

        const completedTugas = await this.prisma.tugas.count({
          where: {
            ditugaskan_ke: user.id,
            status: 'selesai',
          },
        });

        const activePerkara = await this.prisma.timPerkara.count({
          where: {
            user_id: user.id,
            perkara: {
              status: { in: ['aktif', 'pending'] },
            },
          },
        });

        const workload_score =
          activePerkara * 3 +
          pendingTugas * 2 +
          user._count.dokumen_diunggah * 0.5;

        return {
          user_id: user.id,
          user_name: user.nama_lengkap || user.email,
          email: user.email,
          role: user.role,
          active_perkara: activePerkara,
          pending_tugas: pendingTugas,
          completed_tugas: completedTugas,
          total_dokumen: user._count.dokumen_diunggah,
          workload_score: Math.round(workload_score * 10) / 10,
        };
      }),
    );

    return distribution.sort((a, b) => b.workload_score - a.workload_score);
  }
}
