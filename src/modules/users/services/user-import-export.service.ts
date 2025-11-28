// ===== FILE: user-import-export.service.ts =====
// Handles: Bulk import/export users (CSV/Excel), Google Drive integration, Kinerja reports
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleDriveService } from '../../google-drive/google-drive.service';
import { UserRole } from '@prisma/client';
import { BulkOperationResult } from '../../../common/interfaces/statistics.interface';
import { PaginatedResult, UserEntity } from '../../../common/interfaces';
import { QueryUserDto } from '../dto/query-user.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

type UserWithoutPassword = Omit<UserEntity, 'password'>;

@Injectable()
export class UserImportExportService {
  constructor(
    private prisma: PrismaService,
    private googleDrive: GoogleDriveService,
  ) {}

  async bulkImportUsers(
    file: Express.Multer.File,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Detect file type based on extension or mimetype
      const isExcel =
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.mimetype.includes('spreadsheet') ||
        file.mimetype.includes('excel');

      let rows: Array<{
        email: string;
        nama_lengkap: string;
        role: UserRole;
        jabatan?: string;
        telepon?: string;
      }> = [];

      if (isExcel) {
        // Parse Excel file
        console.log('📊 Parsing Excel file...');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });

        // Get first sheet or 'Users' sheet
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Users')) {
          sheetName = 'Users';
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        });

        rows = jsonData as Array<{
          email: string;
          nama_lengkap: string;
          role: UserRole;
          jabatan?: string;
          telepon?: string;
        }>;

        console.log(`✅ Parsed ${rows.length} rows from Excel`);
      } else {
        // Parse CSV file
        console.log('📄 Parsing CSV file...');
        const csvData = file.buffer.toString('utf-8');
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
        });

        rows = parsed.data as Array<{
          email: string;
          nama_lengkap: string;
          role: UserRole;
          jabatan?: string;
          telepon?: string;
        }>;

        console.log(`✅ Parsed ${rows.length} rows from CSV`);
      }

      // Process rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          // Validate required fields
          if (!row.email || !row.nama_lengkap || !row.role) {
            result.failed++;
            result.errors.push({
              row: i + 2,
              email: row.email || 'N/A',
              reason: 'Missing required fields (email, nama_lengkap, or role)',
            });
            continue;
          }

          // Validate role
          const validRoles = ['admin', 'advokat', 'paralegal', 'staff', 'klien'];
          if (!validRoles.includes(row.role)) {
            result.failed++;
            result.errors.push({
              row: i + 2,
              email: row.email,
              reason: `Invalid role: ${row.role}. Must be one of: ${validRoles.join(', ')}`,
            });
            continue;
          }

          // Check if email already exists
          const existing = await this.prisma.user.findUnique({
            where: { email: row.email },
          });

          if (existing) {
            result.failed++;
            result.errors.push({
              row: i + 2,
              email: row.email,
              reason: 'Email already exists',
            });
            continue;
          }

          // Generate temporary password
          const tempPassword = crypto.randomBytes(4).toString('hex');
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          // Create user
          await this.prisma.user.create({
            data: {
              email: row.email,
              password: hashedPassword,
              nama_lengkap: row.nama_lengkap,
              role: row.role as UserRole,
              jabatan: row.jabatan || null,
              telepon: row.telepon || null,
            },
          });

          // Log activity
          await this.prisma.logAktivitas.create({
            data: {
              user_id: currentUserId,
              aksi: 'BULK_IMPORT_USER',
              jenis_entitas: 'user',
              detail: { email: row.email },
            },
          });

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            email: row.email,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(
        `✅ Bulk import completed: ${result.success} success, ${result.failed} failed`,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Export users to Google Drive
   */
  async exportUsersToGoogleDrive(
    format: 'csv' | 'excel',
    findAllFn: (filters?: QueryUserDto) => Promise<PaginatedResult<UserWithoutPassword>>,
    filters?: QueryUserDto,
  ): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    embedLink: string;
  }> {
    try {
      // Get users data
      const result = await findAllFn(filters || {});
      const users = result.data;

      let buffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (format === 'csv') {
        // Generate CSV
        const csv = Papa.unparse(users);
        buffer = Buffer.from(csv, 'utf-8');
        fileName = `users-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        // Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(users);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        buffer = XLSX.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
        }) as Buffer;

        fileName = `users-export-${Date.now()}.xlsx`;
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
        `✅ Users exported to Google Drive: ${driveFile.name} (${driveFile.id})`,
      );

      return {
        fileId: driveFile.id,
        fileName: driveFile.name,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        embedLink: driveFile.embedLink,
      };
    } catch (error) {
      console.error('Export to Google Drive failed:', error);
      throw new BadRequestException(
        `Failed to export users to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * List import files from Google Drive (CSV & Excel only)
   */
  async listGoogleDriveImportFiles(): Promise<
    Array<{
      id: string;
      name: string;
      mimeType: string;
      size: string;
      createdTime: string;
      modifiedTime: string;
      webViewLink: string;
    }>
  > {
    try {
      // Get CSV files
      const csvFiles = await this.googleDrive.listFiles({
        mimeType: 'text/csv',
        nameContains: 'user',
        pageSize: 50,
      });

      // Get Excel files
      const excelFiles = await this.googleDrive.listFiles({
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        nameContains: 'user',
        pageSize: 50,
      });

      // Combine and sort by modified time
      const allFiles = [...csvFiles, ...excelFiles].sort(
        (a, b) =>
          new Date(b.modifiedTime).getTime() -
          new Date(a.modifiedTime).getTime(),
      );

      console.log(
        `✅ Found ${allFiles.length} import files in Google Drive`,
      );

      return allFiles;
    } catch (error) {
      console.error('List Google Drive files failed:', error);
      throw new BadRequestException(
        'Failed to list files from Google Drive',
      );
    }
  }

  /**
   * Import users from Google Drive file
   */
  async importUsersFromGoogleDrive(
    fileId: string,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    try {
      console.log(`📥 Importing users from Google Drive file: ${fileId}`);

      // Download file from Google Drive
      const buffer = await this.googleDrive.downloadFile(fileId);

      // Get file metadata to determine type
      const fileMetadata = await this.googleDrive.getFile(fileId);
      const fileName = fileMetadata.name;

      // Create a mock file object for bulkImportUsers
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: fileName,
        encoding: '7bit',
        mimetype: fileName.endsWith('.xlsx')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
        buffer,
        size: buffer.length,

        stream: Readable.from(buffer),
        destination: '',
        filename: fileName,
        path: '',
      };

      // Reuse existing bulk import logic
      const result = await this.bulkImportUsers(mockFile, currentUserId);

      console.log(
        `✅ Import from Google Drive completed: ${result.success} success, ${result.failed} failed`,
      );

      return result;
    } catch (error) {
      console.error('Import from Google Drive failed:', error);
      throw new BadRequestException(
        `Failed to import users from Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Export Kinerja (Performance) Report to Google Drive
   */
  async exportKinerjaReportToGoogleDrive(
    format: 'csv' | 'excel',
    getTeamStatisticsFn: () => Promise<any>,
    getWorkloadDistributionFn: () => Promise<any[]>,
  ): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    embedLink: string;
  }> {
    try {
      // Get performance data
      const statistics = await getTeamStatisticsFn();
      const workloadData = await getWorkloadDistributionFn();

      let buffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (format === 'csv') {
        // Generate CSV with workload data
        const csv = Papa.unparse(workloadData);
        buffer = Buffer.from(csv, 'utf-8');
        fileName = `laporan-kinerja-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        // Generate Excel with ExcelJS for professional formatting
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Sheet 1: Statistics
        const statsSheet = workbook.addWorksheet('Ringkasan Statistik', {
          views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
        });

        statsSheet.columns = [
          { header: 'Metrik', key: 'metric', width: 30 },
          { header: 'Nilai', key: 'value', width: 20 },
        ];

        statsSheet.addRow({ metric: 'Total User', value: statistics.total_users });
        statsSheet.addRow({ metric: 'User Aktif', value: statistics.active_users });
        statsSheet.addRow({ metric: 'User Tidak Aktif', value: statistics.inactive_users });
        statsSheet.addRow({ metric: 'Penambahan Terbaru', value: statistics.recent_additions });
        statsSheet.addRow({ metric: '', value: '' });
        statsSheet.addRow({ metric: 'Distribusi Berdasarkan Role', value: '' });
        Object.entries(statistics.by_role).forEach(([role, count]) => {
          statsSheet.addRow({ metric: `  ${role}`, value: count });
        });

        // Style statistics sheet
        statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        statsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        statsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        statsSheet.getRow(1).height = 25;

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

        workloadSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        workloadSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70AD47' },
        };
        workloadSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        workloadSheet.getRow(1).height = 25;

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

        buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        fileName = `laporan-kinerja-${Date.now()}.xlsx`;
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
        `✅ Kinerja report exported to Google Drive: ${driveFile.name} (${driveFile.id})`,
      );

      return {
        fileId: driveFile.id,
        fileName: driveFile.name,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        embedLink: driveFile.embedLink,
      };
    } catch (error) {
      console.error('Export Kinerja report to Google Drive failed:', error);
      throw new BadRequestException(
        `Failed to export Kinerja report to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
