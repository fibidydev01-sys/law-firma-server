// ============================================================================
// FILE: server/src/modules/perkara/perkara.service.ts
// ✅ FIXED: Cache invalidation handled internally
// ============================================================================
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreatePerkaraDto } from './dto/create-perkara.dto';
import { UpdatePerkaraDto } from './dto/update-perkara.dto';
import { QueryPerkaraDto } from './dto/query-perkara.dto';
import {
  PaginatedResult,
  PerkaraWithKlien,
  PerkaraWithRelations,
  PerkaraStatistics,
  CreateLogAktivitasData,
} from '../../common/interfaces';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import type { Response } from 'express';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

@Injectable()
export class PerkaraService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
    private googleDrive: GoogleDriveService,
  ) {}

  private getCacheKey(
    method: string,
    params?: Record<string, unknown>,
  ): string {
    if (!params) return `perkara:${method}`;
    return `perkara:${method}:${JSON.stringify(params)}`;
  }

  // ✅ PUBLIC METHOD: Bisa dipanggil dari module lain tanpa circular dependency
  async invalidatePerkaraCache(perkaraId: string): Promise<void> {
    try {
      console.log('🗑️ Invalidating perkara cache for:', perkaraId);

      const cacheKeys = [
        this.getCacheKey('findOne', { id: perkaraId }),
        this.getCacheKey('statistics', { perkaraId }),
      ];

      await Promise.all(cacheKeys.map((key) => this.cache.del(key)));
      await this.cache.delPattern('perkara:findAll:*');

      console.log('✅ Perkara cache invalidated successfully');
    } catch (error) {
      console.error('⚠️ Failed to invalidate perkara cache:', error);
    }
  }

  async findAll(
    query: QueryPerkaraDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<PerkaraWithKlien>> {
    const {
      page = 1,
      limit = 10,
      search,
      jenis_perkara,
      status,
      klien_id,
      nama_pengadilan,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.PerkaraWhereInput = {};

    // RBAC: DATA FILTERING BASED ON USER ROLE
    if (userRole === UserRole.klien) {
      // ✅ FIX: Look up klien_id from akses_portal_klien (user_id -> klien_id)
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (aksesPortal) {
        where.klien_id = aksesPortal.klien_id;
      } else {
        // No klien record linked - return empty
        where.klien_id = 'no-access';
      }
    } else if (userRole === UserRole.advokat) {
      where.OR = [
        { dibuat_oleh: userId },
        { tim_perkara: { some: { user_id: userId } } },
      ];
    }

    if (search) {
      const searchCondition: Prisma.PerkaraWhereInput = {
        OR: [
          { nomor_perkara: { contains: search, mode: 'insensitive' } },
          { judul: { contains: search, mode: 'insensitive' } },
          { pihak_lawan: { contains: search, mode: 'insensitive' } },
        ],
      };

      if (where.AND) {
        if (Array.isArray(where.AND)) {
          where.AND.push(searchCondition);
        } else {
          where.AND = [where.AND, searchCondition];
        }
      } else if (where.OR || where.klien_id) {
        where.AND = [searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    if (jenis_perkara) where.jenis_perkara = jenis_perkara;
    if (status) where.status = status;
    if (klien_id) where.klien_id = klien_id;
    if (nama_pengadilan) {
      where.nama_pengadilan = {
        contains: nama_pengadilan,
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.PerkaraOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.perkara.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      this.prisma.perkara.count({ where }),
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

  async findOne(id: string): Promise<PerkaraWithRelations> {
    const cacheKey = this.getCacheKey('findOne', { id });

    const cached = await this.cache.get<PerkaraWithRelations>(cacheKey);
    if (cached) return cached;

    const perkara = await this.prisma.perkara.findUnique({
      where: { id },
      include: {
        klien: true,
        pembuat: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            jabatan: true,
            avatar_url: true,
            telepon: true,
          },
        },
        tim_perkara: {
          include: {
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
        },
        tugas: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            petugas: {
              select: {
                id: true,
                email: true,
                nama_lengkap: true,
                role: true,
                avatar_url: true,
              },
            },
          },
        },
        dokumen: {
          orderBy: { tanggal_upload: 'desc' },
          take: 10,
        },
        jadwal_sidang: {
          orderBy: { tanggal_sidang: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            tugas: true,
            dokumen: true,
            jadwal_sidang: true,
            catatan_perkara: true,
          },
        },
      },
    });

    if (!perkara) {
      throw new NotFoundException('Perkara tidak ditemukan');
    }

    await this.cache.set(cacheKey, perkara, 1800);
    return perkara;
  }

  async create(
    dto: CreatePerkaraDto,
    userId: string,
  ): Promise<PerkaraWithKlien> {
    const perkara = await this.prisma.perkara.create({
      data: {
        ...dto,
        dibuat_oleh: userId,
      },
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
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'CREATE_PERKARA',
      jenis_entitas: 'perkara',
      id_entitas: perkara.id,
      detail: {
        nomor_perkara: perkara.nomor_perkara,
        judul: perkara.judul,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.cache.delPattern('perkara:findAll:*');
    return perkara;
  }

  async update(
    id: string,
    dto: UpdatePerkaraDto,
    userId: string,
  ): Promise<PerkaraWithKlien> {
    await this.findOne(id);

    const updateData: Prisma.PerkaraUpdateInput = { ...dto };

    const perkara = await this.prisma.perkara.update({
      where: { id },
      data: updateData,
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
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_PERKARA',
      jenis_entitas: 'perkara',
      id_entitas: perkara.id,
      detail: { nomor_perkara: perkara.nomor_perkara },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.invalidatePerkaraCache(id);
    return perkara;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const perkara = await this.findOne(id);

    await this.prisma.perkara.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_PERKARA',
      jenis_entitas: 'perkara',
      id_entitas: id,
      detail: { nomor_perkara: perkara.nomor_perkara },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    await this.invalidatePerkaraCache(id);
    return { message: 'Perkara berhasil dihapus' };
  }

  async getStatistics(perkaraId: string): Promise<PerkaraStatistics> {
    const cacheKey = this.getCacheKey('statistics', { perkaraId });

    const cached = await this.cache.get<PerkaraStatistics>(cacheKey);
    if (cached) return cached;

    const perkara = await this.findOne(perkaraId);

    const [totalTugas, tugasSelesai, totalDokumen, totalSidang] =
      await Promise.all([
        this.prisma.tugas.count({ where: { perkara_id: perkaraId } }),
        this.prisma.tugas.count({
          where: { perkara_id: perkaraId, status: 'selesai' },
        }),
        this.prisma.dokumenHukum.count({ where: { perkara_id: perkaraId } }),
        this.prisma.jadwalSidang.count({ where: { perkara_id: perkaraId } }),
      ]);

    const result: PerkaraStatistics = {
      perkara_info: {
        nomor_perkara: perkara.nomor_perkara,
        judul: perkara.judul,
        status: perkara.status,
      },
      statistik: {
        total_tugas: totalTugas,
        tugas_selesai: tugasSelesai,
        tugas_progress:
          totalTugas > 0
            ? ((tugasSelesai / totalTugas) * 100).toFixed(2) + '%'
            : '0%',
        total_dokumen: totalDokumen,
        total_sidang: totalSidang,
      },
    };

    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  // ============================================================================
  // LAPORAN KEUANGAN (FINANCE REPORT) METHODS
  // ============================================================================

  async getFinanceStatistics(): Promise<{
    total_perkara: number;
    total_nilai_perkara: number;
    total_nilai_fee: number;
    by_status_pembayaran: Record<string, number>;
    pending_payment: number;
    paid_payment: number;
  }> {
    const cacheKey = this.getCacheKey('financeStatistics');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as any;

    // Get all perkara with fee data
    const allPerkara = await this.prisma.perkara.findMany({
      select: {
        nilai_perkara: true,
        nilai_fee: true,
        status_pembayaran: true,
      },
    });

    // Calculate totals
    const totalNilaiPerkara = allPerkara.reduce(
      (sum, p) => sum + (p.nilai_perkara ? Number(p.nilai_perkara) : 0),
      0,
    );

    const totalNilaiFee = allPerkara.reduce(
      (sum, p) => sum + (p.nilai_fee ? Number(p.nilai_fee) : 0),
      0,
    );

    // Group by payment status
    const byStatusPembayaran: Record<string, number> = {};
    allPerkara.forEach((p) => {
      const status = p.status_pembayaran || 'Belum ditentukan';
      byStatusPembayaran[status] = (byStatusPembayaran[status] || 0) + 1;
    });

    const result = {
      total_perkara: allPerkara.length,
      total_nilai_perkara: totalNilaiPerkara,
      total_nilai_fee: totalNilaiFee,
      by_status_pembayaran: byStatusPembayaran,
      pending_payment: byStatusPembayaran['Pending'] || 0,
      paid_payment: byStatusPembayaran['Lunas'] || 0,
    };

    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async exportKeuanganReport(
    format: 'csv' | 'excel',
    filters?: QueryPerkaraDto,
    res?: Response,
  ): Promise<void> {
    if (!res) {
      throw new BadRequestException('Response object is required');
    }

    // Get perkara data with financial info
    const result = await this.findAll(filters || {}, '', UserRole.admin);
    const perkaraList = result.data;

    // Prepare finance data
    const financeData = perkaraList.map((p: any) => ({
      nomor_perkara: p.nomor_perkara,
      judul: p.judul,
      klien: p.klien?.nama_klien || '-',
      jenis_perkara: p.jenis_perkara,
      status: p.status,
      nilai_perkara: p.nilai_perkara ? Number(p.nilai_perkara) : 0,
      nilai_fee: p.nilai_fee ? Number(p.nilai_fee) : 0,
      status_pembayaran: p.status_pembayaran || 'Belum ditentukan',
      tanggal_register: p.tanggal_register,
      created_at: p.created_at,
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(financeData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=laporan-keuangan-${Date.now()}.csv`,
      );
      res.send(csv);
      return;
    }

    // Excel export with professional styling using ExcelJS
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Summary Statistics
    const summarySheet = workbook.addWorksheet('Ringkasan Keuangan', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    const stats = await this.getFinanceStatistics();

    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 35 },
      { header: 'Nilai', key: 'value', width: 25 },
    ];

    summarySheet.addRow({ metric: 'Total Perkara', value: stats.total_perkara });
    summarySheet.addRow({
      metric: 'Total Nilai Perkara',
      value: `Rp ${stats.total_nilai_perkara.toLocaleString('id-ID')}`,
    });
    summarySheet.addRow({
      metric: 'Total Nilai Fee',
      value: `Rp ${stats.total_nilai_fee.toLocaleString('id-ID')}`,
    });
    summarySheet.addRow({
      metric: 'Pembayaran Lunas',
      value: stats.paid_payment,
    });
    summarySheet.addRow({
      metric: 'Pembayaran Pending',
      value: stats.pending_payment,
    });
    summarySheet.addRow({ metric: '', value: '' });
    summarySheet.addRow({ metric: 'Status Pembayaran', value: '' });
    Object.entries(stats.by_status_pembayaran).forEach(([status, count]) => {
      summarySheet.addRow({ metric: `  ${status}`, value: count });
    });

    // Style summary sheet
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 25;

    summarySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle' };
          if (rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' },
            };
          }
        }
      });
    });

    // Sheet 2: Detailed Data
    const detailSheet = workbook.addWorksheet('Detail Keuangan', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    detailSheet.columns = [
      { header: 'Nomor Perkara', key: 'nomor_perkara', width: 25 },
      { header: 'Judul', key: 'judul', width: 35 },
      { header: 'Klien', key: 'klien', width: 30 },
      { header: 'Jenis', key: 'jenis_perkara', width: 20 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Nilai Perkara', key: 'nilai_perkara', width: 20 },
      { header: 'Nilai Fee', key: 'nilai_fee', width: 20 },
      { header: 'Status Pembayaran', key: 'status_pembayaran', width: 22 },
    ];

    financeData.forEach((item) => {
      detailSheet.addRow(item);
    });

    // Style detail sheet
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    detailSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    detailSheet.getRow(1).height = 25;

    detailSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle' };
          if (rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' },
            };
          }
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-keuangan-${Date.now()}.xlsx`,
    );
    res.send(Buffer.from(buffer));
  }

  async exportKeuanganReportToGoogleDrive(
    format: 'csv' | 'excel',
    filters?: QueryPerkaraDto,
  ): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    embedLink: string;
  }> {
    try {
      // Get perkara data with financial info
      const result = await this.findAll(filters || {}, '', UserRole.admin);
      const perkaraList = result.data;

      // Prepare finance data
      const financeData = perkaraList.map((p: any) => ({
        nomor_perkara: p.nomor_perkara,
        judul: p.judul,
        klien: p.klien?.nama_klien || '-',
        jenis_perkara: p.jenis_perkara,
        status: p.status,
        nilai_perkara: p.nilai_perkara ? Number(p.nilai_perkara) : 0,
        nilai_fee: p.nilai_fee ? Number(p.nilai_fee) : 0,
        status_pembayaran: p.status_pembayaran || 'Belum ditentukan',
      }));

      let buffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (format === 'csv') {
        const csv = Papa.unparse(financeData);
        buffer = Buffer.from(csv, 'utf-8');
        fileName = `laporan-keuangan-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        // Excel with ExcelJS
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        const stats = await this.getFinanceStatistics();

        // Summary sheet
        const summarySheet = workbook.addWorksheet('Ringkasan Keuangan', {
          views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
        });

        summarySheet.columns = [
          { header: 'Metrik', key: 'metric', width: 35 },
          { header: 'Nilai', key: 'value', width: 25 },
        ];

        summarySheet.addRow({ metric: 'Total Perkara', value: stats.total_perkara });
        summarySheet.addRow({
          metric: 'Total Nilai Perkara',
          value: `Rp ${stats.total_nilai_perkara.toLocaleString('id-ID')}`,
        });
        summarySheet.addRow({
          metric: 'Total Nilai Fee',
          value: `Rp ${stats.total_nilai_fee.toLocaleString('id-ID')}`,
        });

        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        summarySheet.getRow(1).height = 25;

        summarySheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            };
            if (rowNumber > 1) {
              cell.alignment = { vertical: 'middle' };
              if (rowNumber % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2F2F2' },
                };
              }
            }
          });
        });

        // Detail sheet
        const detailSheet = workbook.addWorksheet('Detail Keuangan', {
          views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
        });

        detailSheet.columns = [
          { header: 'Nomor Perkara', key: 'nomor_perkara', width: 25 },
          { header: 'Judul', key: 'judul', width: 35 },
          { header: 'Klien', key: 'klien', width: 30 },
          { header: 'Nilai Perkara', key: 'nilai_perkara', width: 20 },
          { header: 'Nilai Fee', key: 'nilai_fee', width: 20 },
          { header: 'Status Pembayaran', key: 'status_pembayaran', width: 22 },
        ];

        financeData.forEach((item) => {
          detailSheet.addRow(item);
        });

        detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        detailSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70AD47' },
        };
        detailSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        detailSheet.getRow(1).height = 25;

        detailSheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            };
            if (rowNumber > 1) {
              cell.alignment = { vertical: 'middle' };
              if (rowNumber % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2F2F2' },
                };
              }
            }
          });
        });

        buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        fileName = `laporan-keuangan-${Date.now()}.xlsx`;
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      // Upload to Google Drive
      const driveFile = await this.googleDrive.uploadFile({
        fileName,
        mimeType,
        buffer,
      });

      console.log(
        `✅ Keuangan report exported to Google Drive: ${driveFile.name} (${driveFile.id})`,
      );

      return {
        fileId: driveFile.id,
        fileName: driveFile.name,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        embedLink: driveFile.embedLink,
      };
    } catch (error) {
      console.error('Export Keuangan report to Google Drive failed:', error);
      throw new BadRequestException(
        `Failed to export Keuangan report to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
