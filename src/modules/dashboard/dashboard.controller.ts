// ============================================================================
// FILE: src/modules/dashboard/dashboard.controller.ts
// ============================================================================

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  DashboardService,
  // ✅ FIX: Import types
  DashboardStats,
  RecentActivity,
  UserStats,
  UpcomingSidang,
  ChartDataItem,
  StatusChartDataItem,
} from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get statistik dashboard utama' })
  @ApiResponse({ status: 200, description: 'Statistik berhasil diambil' })
  getStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }

  @Get('recent-activities')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get aktivitas terbaru' })
  @ApiResponse({
    status: 200,
    description: 'Aktivitas terbaru berhasil diambil',
  })
  getRecentActivities(): Promise<RecentActivity[]> {
    return this.dashboardService.getRecentActivities();
  }

  @Get('my-stats')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get statistik personal user' })
  @ApiResponse({
    status: 200,
    description: 'Statistik personal berhasil diambil',
  })
  getMyStats(@CurrentUser('id') userId: string): Promise<UserStats> {
    return this.dashboardService.getMyStats(userId);
  }

  @Get('upcoming-sidang')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get jadwal sidang mendatang' })
  @ApiResponse({
    status: 200,
    description: 'Jadwal sidang mendatang berhasil diambil',
  })
  getUpcomingSidang(): Promise<UpcomingSidang[]> {
    return this.dashboardService.getUpcomingSidang();
  }

  @Get('chart/perkara-by-jenis')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get chart perkara berdasarkan jenis' })
  @ApiResponse({ status: 200, description: 'Data chart berhasil diambil' })
  getPerkaraByJenisChart(): Promise<ChartDataItem[]> {
    return this.dashboardService.getPerkaraByJenisChart();
  }

  @Get('chart/perkara-by-status')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get chart perkara berdasarkan status' })
  @ApiResponse({ status: 200, description: 'Data chart berhasil diambil' })
  getPerkaraByStatusChart(): Promise<StatusChartDataItem[]> {
    return this.dashboardService.getPerkaraByStatusChart();
  }
}
