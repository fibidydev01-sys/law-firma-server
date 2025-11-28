// ============================================================================
// FILE: server/src/modules/perkara/perkara.controller.ts - WITH RBAC
// ============================================================================
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { PerkaraService } from './perkara.service';
import { CreatePerkaraDto } from './dto/create-perkara.dto';
import { UpdatePerkaraDto } from './dto/update-perkara.dto';
import { QueryPerkaraDto } from './dto/query-perkara.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Perkara')
@ApiBearerAuth()
@Controller('perkara')
@UseGuards(RolesGuard)
export class PerkaraController {
  constructor(private readonly perkaraService: PerkaraService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.advokat)
  @ApiOperation({ summary: 'Buat perkara baru' })
  @ApiResponse({ status: 201, description: 'Perkara berhasil dibuat' })
  create(@Body() dto: CreatePerkaraDto, @CurrentUser('id') userId: string) {
    return this.perkaraService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get semua perkara dengan pagination' })
  @ApiResponse({ status: 200, description: 'Data perkara berhasil diambil' })
  findAll(
    @Query() query: QueryPerkaraDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole, // ✅ AMBIL ROLE
  ) {
    return this.perkaraService.findAll(query, userId, userRole);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail perkara by ID' })
  @ApiResponse({ status: 200, description: 'Detail perkara berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.perkaraService.findOne(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get statistik perkara' })
  @ApiResponse({ status: 200, description: 'Statistik berhasil diambil' })
  getStatistics(@Param('id') id: string) {
    return this.perkaraService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Update perkara by ID' })
  @ApiResponse({ status: 200, description: 'Perkara berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePerkaraDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.perkaraService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Hapus perkara by ID' })
  @ApiResponse({ status: 200, description: 'Perkara berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.perkaraService.remove(id, userId);
  }

  // ============================================================================
  // LAPORAN KEUANGAN (FINANCE REPORT) ENDPOINTS
  // ============================================================================

  @Post('reports/keuangan/export')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin, UserRole.partner)
  @ApiOperation({ summary: 'Export Laporan Keuangan to CSV/Excel (local download)' })
  @ApiResponse({ status: 200, description: 'Keuangan report exported successfully' })
  async exportKeuanganReport(
    @Body() dto: { format: 'csv' | 'excel'; filters?: QueryPerkaraDto },
    @Res() res: Response,
  ): Promise<void> {
    return this.perkaraService.exportKeuanganReport(dto.format, dto.filters, res);
  }

  @Post('reports/keuangan/export-to-drive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin, UserRole.partner)
  @ApiOperation({ summary: 'Export Laporan Keuangan to Google Drive' })
  @ApiResponse({
    status: 200,
    description: 'Keuangan report exported to Google Drive successfully',
  })
  async exportKeuanganToGoogleDrive(
    @Body() dto: { format: 'csv' | 'excel'; filters?: QueryPerkaraDto },
  ) {
    return this.perkaraService.exportKeuanganReportToGoogleDrive(dto.format, dto.filters);
  }

  @Get('reports/keuangan/statistics')
  @Roles(UserRole.admin, UserRole.partner)
  @ApiOperation({ summary: 'Get statistik keuangan' })
  @ApiResponse({ status: 200, description: 'Finance statistics retrieved' })
  getFinanceStatistics() {
    return this.perkaraService.getFinanceStatistics();
  }
}
