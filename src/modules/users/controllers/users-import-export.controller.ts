// ===== FILE: users-import-export.controller.ts =====
// Handles: Import/Export users (CSV/Excel), Google Drive integration, Kinerja reports
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { ExportUsersDto } from '../dto/export-users.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { QueryUserDto } from '../dto/query-user.dto';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

@ApiTags('Users - Import/Export')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersImportExportController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================================================
  // TEMPLATE DOWNLOADS
  // ============================================================================

  @Get('import-template')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Download CSV template for bulk import' })
  @ApiResponse({ status: 200, description: 'CSV template downloaded' })
  downloadTemplate(@Res() res: Response): void {
    const csv = [
      'email,nama_lengkap,role,jabatan,telepon',
      'john.doe@example.com,John Doe,advokat,Senior Partner,081234567890',
      'jane.smith@example.com,Jane Smith,paralegal,Paralegal,081298765432',
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=user-import-template.csv',
    );
    res.send(csv);
  }

  @Get('import-template-excel')
  @Roles(UserRole.admin)
  @ApiOperation({
    summary:
      'Download Excel template for bulk import with professional styling, borders, and data validation',
  })
  @ApiResponse({ status: 200, description: 'Excel template downloaded' })
  async downloadExcelTemplate(@Res() res: Response): Promise<void> {
    // ✅ Use ExcelJS for professional styling with borders, colors, and formatting
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // ===== SHEET 1: Instructions =====
    const instructionsSheet = workbook.addWorksheet('Instructions', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Instructions header
    instructionsSheet.columns = [
      { header: 'Field', key: 'field', width: 18 },
      { header: 'Required', key: 'required', width: 12 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Example', key: 'example', width: 30 },
    ];

    // Add instruction rows
    const instructions = [
      {
        field: 'email',
        required: 'YES',
        description: 'Email user (harus unik, format email valid)',
        example: 'john.doe@example.com',
      },
      {
        field: 'nama_lengkap',
        required: 'YES',
        description: 'Nama lengkap user',
        example: 'John Doe',
      },
      {
        field: 'role',
        required: 'YES',
        description: 'Role user: admin, advokat, paralegal, staff, atau klien',
        example: 'advokat',
      },
      {
        field: 'jabatan',
        required: 'NO',
        description: 'Jabatan atau posisi user (opsional)',
        example: 'Senior Partner',
      },
      {
        field: 'telepon',
        required: 'NO',
        description: 'Nomor telepon user (opsional)',
        example: '081234567890',
      },
    ];

    instructions.forEach((instruction) => {
      instructionsSheet.addRow(instruction);
    });

    // Style instructions header (row 1)
    instructionsSheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    instructionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    instructionsSheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    instructionsSheet.getRow(1).height = 25;

    // Add borders to all cells in instructions
    instructionsSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
    });

    // Highlight required fields
    for (let i = 2; i <= instructions.length + 1; i++) {
      const requiredCell = instructionsSheet.getCell(`B${i}`);
      if (requiredCell.value === 'YES') {
        requiredCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE699' },
        };
        requiredCell.font = { bold: true, color: { argb: 'FFD97706' } };
      } else {
        requiredCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' },
        };
        requiredCell.font = { color: { argb: 'FF70AD47' } };
      }
    }

    // ===== SHEET 2: Users (Template Data) =====
    const usersSheet = workbook.addWorksheet('Users', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Users header
    usersSheet.columns = [
      { header: 'email', key: 'email', width: 35 },
      { header: 'nama_lengkap', key: 'nama_lengkap', width: 30 },
      { header: 'role', key: 'role', width: 18 },
      { header: 'jabatan', key: 'jabatan', width: 28 },
      { header: 'telepon', key: 'telepon', width: 20 },
    ];

    // Sample data
    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        nama_lengkap: 'John Doe',
        role: 'advokat',
        jabatan: 'Senior Partner',
        telepon: '081234567890',
      },
      {
        email: 'jane.smith@example.com',
        nama_lengkap: 'Jane Smith',
        role: 'paralegal',
        jabatan: 'Paralegal',
        telepon: '081298765432',
      },
      {
        email: 'client@example.com',
        nama_lengkap: 'Client Name',
        role: 'klien',
        jabatan: 'CEO',
        telepon: '081234567891',
      },
    ];

    sampleUsers.forEach((user) => {
      usersSheet.addRow(user);
    });

    // Style users header
    usersSheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    usersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    usersSheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    usersSheet.getRow(1).height = 25;

    // Add borders and styling to all cells
    usersSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };

        // Alternate row colors for sample data
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

    // Add note row
    const noteRow = usersSheet.addRow([
      '← Delete sample rows above and add your data here',
      '',
      '',
      '',
      '',
    ]);
    noteRow.font = { italic: true, color: { argb: 'FF666666' } };
    noteRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' },
    };
    noteRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=user-import-template.xlsx',
    );
    res.send(Buffer.from(buffer));
  }

  // ============================================================================
  // IMPORT OPERATIONS
  // ============================================================================

  @Post('bulk-import')
  @Roles(UserRole.admin)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import users from CSV/Excel' })
  @ApiResponse({
    status: 201,
    description: 'Bulk import completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', example: 5 },
        failed: { type: 'number', example: 1 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number' },
              email: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.usersService.bulkImportUsers(file, userId);
  }

  @Get('drive-files')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'List import files from Google Drive' })
  @ApiResponse({
    status: 200,
    description: 'List of CSV/Excel files in Google Drive',
  })
  listGoogleDriveFiles() {
    return this.usersService.listGoogleDriveImportFiles();
  }

  @Post('import-from-drive/:fileId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Import users from Google Drive file' })
  @ApiResponse({ status: 200, description: 'Import completed' })
  importFromGoogleDrive(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.importUsersFromGoogleDrive(fileId, userId);
  }

  // ============================================================================
  // EXPORT OPERATIONS
  // ============================================================================

  @Post('export')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Export users to CSV/Excel (local download)' })
  @ApiResponse({ status: 200, description: 'Users exported successfully' })
  async exportUsers(
    @Body() dto: ExportUsersDto,
    @Res() res: Response,
  ): Promise<void> {
    const { format, filters } = dto;

    const queryFilters: QueryUserDto = filters || {};
    const result = await this.usersService.findAll(queryFilters);
    const users = result.data;

    if (format === 'csv') {
      const csv = Papa.unparse(users);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=users-export-${Date.now()}.csv`,
      );
      res.send(csv);
      return;
    }

    // Excel export
    const worksheet = XLSX.utils.json_to_sheet(users);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=users-export-${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('export-to-drive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Export users to Google Drive' })
  @ApiResponse({
    status: 200,
    description: 'Users exported to Google Drive successfully',
  })
  async exportToGoogleDrive(@Body() dto: ExportUsersDto) {
    const { format, filters } = dto;
    return this.usersService.exportUsersToGoogleDrive(format, filters);
  }

  // ============================================================================
  // LAPORAN KINERJA (PERFORMANCE REPORT) ENDPOINTS
  // ============================================================================

  @Post('reports/kinerja/export')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({
    summary: 'Export Laporan Kinerja to CSV/Excel (local download)',
  })
  @ApiResponse({
    status: 200,
    description: 'Kinerja report exported successfully',
  })
  async exportKinerjaReport(
    @Body() dto: { format: 'csv' | 'excel' },
    @Res() res: Response,
  ): Promise<void> {
    const { format } = dto;

    // Get performance data
    const statistics = await this.usersService.getTeamStatistics();
    const workloadData = await this.usersService.getWorkloadDistribution();

    if (format === 'csv') {
      // Generate CSV with workload data
      const csv = Papa.unparse(workloadData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=laporan-kinerja-${Date.now()}.csv`,
      );
      res.send(csv);
      return;
    }

    // Excel export with professional styling using ExcelJS
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Overview/Statistics
    const statsSheet = workbook.addWorksheet('Ringkasan Statistik', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    statsSheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Nilai', key: 'value', width: 20 },
    ];

    // Add statistics data
    statsSheet.addRow({ metric: 'Total User', value: statistics.total_users });
    statsSheet.addRow({
      metric: 'User Aktif',
      value: statistics.active_users,
    });
    statsSheet.addRow({
      metric: 'User Tidak Aktif',
      value: statistics.inactive_users,
    });
    statsSheet.addRow({
      metric: 'Penambahan Terbaru',
      value: statistics.recent_additions,
    });

    // Add role breakdown
    statsSheet.addRow({ metric: '', value: '' }); // Empty row
    statsSheet.addRow({ metric: 'Distribusi Berdasarkan Role', value: '' });
    Object.entries(statistics.by_role).forEach(([role, count]) => {
      statsSheet.addRow({ metric: `  ${role}`, value: count });
    });

    // Style statistics sheet
    statsSheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    statsSheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    statsSheet.getRow(1).height = 25;

    // Add borders to all cells
    statsSheet.eachRow((row, rowNumber) => {
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

    // Sheet 2: Workload Distribution
    const workloadSheet = workbook.addWorksheet('Distribusi Beban Kerja', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    workloadSheet.columns = [
      { header: 'Nama User', key: 'user_name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Role', key: 'role', width: 18 },
      { header: 'Perkara Aktif', key: 'active_perkara', width: 18 },
      { header: 'Tugas Pending', key: 'pending_tugas', width: 18 },
      { header: 'Tugas Selesai', key: 'completed_tugas', width: 18 },
      { header: 'Total Dokumen', key: 'total_dokumen', width: 18 },
      { header: 'Skor Beban Kerja', key: 'workload_score', width: 20 },
    ];

    workloadData.forEach((user) => {
      workloadSheet.addRow(user);
    });

    // Style workload sheet
    workloadSheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    workloadSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    workloadSheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    workloadSheet.getRow(1).height = 25;

    // Add borders and alternate row colors
    workloadSheet.eachRow((row, rowNumber) => {
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
      `attachment; filename=laporan-kinerja-${Date.now()}.xlsx`,
    );
    res.send(Buffer.from(buffer));
  }

  @Post('reports/kinerja/export-to-drive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Export Laporan Kinerja to Google Drive' })
  @ApiResponse({
    status: 200,
    description: 'Kinerja report exported to Google Drive successfully',
  })
  async exportKinerjaToGoogleDrive(@Body() dto: { format: 'csv' | 'excel' }) {
    return this.usersService.exportKinerjaReportToGoogleDrive(dto.format);
  }
}
