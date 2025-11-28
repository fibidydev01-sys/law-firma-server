// ===== FILE: users.service.ts (REFACTORED - ORCHESTRATOR) =====
// Main service that delegates to sub-services for better maintainability
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import {
  PaginatedResult,
  UserEntity,
  UserWithStats,
  CreateLogAktivitasData,
} from '../../common/interfaces';
import {
  TeamStatistics,
  WorkloadDistribution,
  BulkOperationResult,
} from '../../common/interfaces/statistics.interface';
import { UserManagementService } from './services/user-management.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserBulkOperationsService } from './services/user-bulk-operations.service';
import { UserImportExportService } from './services/user-import-export.service';

type UserWithoutPassword = Omit<UserEntity, 'password'>;

const userSelectWithoutPassword = {
  id: true,
  email: true,
  nama_lengkap: true,
  role: true,
  jabatan: true,
  nomor_kta: true,
  nomor_berita_acara: true,
  spesialisasi: true,
  avatar_url: true,
  telepon: true,
  alamat: true,
  is_active: true,
  tanggal_bergabung: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private userManagement: UserManagementService,
    private userStatistics: UserStatisticsService,
    private userBulkOps: UserBulkOperationsService,
    private userImportExport: UserImportExportService,
  ) {}

  // ============================================================================
  // BASIC CRUD OPERATIONS (Core responsibility of this service)
  // ============================================================================

  async create(
    dto: CreateUserDto,
    creatorId: string,
  ): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nama_lengkap: dto.nama_lengkap,
        role: dto.role,
        jabatan: dto.jabatan || null,
        nomor_kta: dto.nomor_kta || null,
        nomor_berita_acara: dto.nomor_berita_acara || null,
        spesialisasi: dto.spesialisasi || null,
        telepon: dto.telepon || null,
        alamat: dto.alamat || null,
      },
      select: userSelectWithoutPassword,
    });

    const logData: CreateLogAktivitasData = {
      user_id: creatorId,
      aksi: 'CREATE_USER',
      jenis_entitas: 'user',
      id_entitas: user.id,
      detail: {
        email: user.email,
        nama: user.nama_lengkap,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return user;
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<PaginatedResult<UserWithoutPassword>> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jabatan: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: userSelectWithoutPassword,
      }),
      this.prisma.user.count({ where }),
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

  async findOne(id: string): Promise<UserWithStats> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nama_lengkap: true,
        role: true,
        jabatan: true,
        nomor_kta: true,
        nomor_berita_acara: true,
        spesialisasi: true,
        avatar_url: true,
        telepon: true,
        alamat: true,
        is_active: true,
        tanggal_bergabung: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            perkara_dibuat: true,
            tugas_ditugaskan: true,
            tim_perkara: true,
            klien_dibuat: true,
            dokumen_diunggah: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    updaterId: string,
  ): Promise<UserWithoutPassword> {
    await this.findOne(id);

    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email sudah digunakan user lain');
      }
    }

    const updateData: Prisma.UserUpdateInput = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelectWithoutPassword,
    });

    const logData: CreateLogAktivitasData = {
      user_id: updaterId,
      aksi: 'UPDATE_USER',
      jenis_entitas: 'user',
      id_entitas: user.id,
      detail: { email: user.email },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return user;
  }

  async remove(id: string, deleterId: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: deleterId,
      aksi: 'DELETE_USER',
      jenis_entitas: 'user',
      id_entitas: id,
      detail: { email: user.email },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    return { message: 'User berhasil dihapus' };
  }

  // ============================================================================
  // DELEGATED OPERATIONS (Delegated to sub-services)
  // ============================================================================

  // Password & Status Management
  async resetUserPassword(id: string): Promise<{ temporary_password: string }> {
    return this.userManagement.resetUserPassword(id);
  }

  async toggleUserStatus(
    id: string,
    active: boolean,
  ): Promise<UserWithoutPassword> {
    return this.userManagement.toggleUserStatus(id, active);
  }

  // Avatar Management
  async uploadAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<{ avatar_url: string }> {
    return this.userManagement.uploadAvatar(id, file);
  }

  async deleteAvatar(id: string): Promise<void> {
    return this.userManagement.deleteAvatar(id);
  }

  // Email Invitations
  async sendInvitationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.userManagement.sendInvitationEmail(id);
  }

  async resendInvitationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.userManagement.resendInvitationEmail(id);
  }

  // Statistics & Analytics
  async getTeamStatistics(): Promise<TeamStatistics> {
    return this.userStatistics.getTeamStatistics();
  }

  async getWorkloadDistribution(): Promise<WorkloadDistribution[]> {
    return this.userStatistics.getWorkloadDistribution();
  }

  // Bulk Operations
  async bulkDeleteUsers(
    userIds: string[],
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    return this.userBulkOps.bulkDeleteUsers(userIds, currentUserId);
  }

  async bulkChangeRole(
    userIds: string[],
    role: UserRole,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    return this.userBulkOps.bulkChangeRole(userIds, role, currentUserId);
  }

  // Import/Export Operations
  async bulkImportUsers(
    file: Express.Multer.File,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    return this.userImportExport.bulkImportUsers(file, currentUserId);
  }

  async exportUsersToGoogleDrive(
    format: 'csv' | 'excel',
    filters?: QueryUserDto,
  ): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    embedLink: string;
  }> {
    return this.userImportExport.exportUsersToGoogleDrive(
      format,
      this.findAll.bind(this),
      filters,
    );
  }

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
    return this.userImportExport.listGoogleDriveImportFiles();
  }

  async importUsersFromGoogleDrive(
    fileId: string,
    currentUserId: string,
  ): Promise<BulkOperationResult> {
    return this.userImportExport.importUsersFromGoogleDrive(
      fileId,
      currentUserId,
    );
  }

  async exportKinerjaReportToGoogleDrive(format: 'csv' | 'excel'): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
    webContentLink: string;
    embedLink: string;
  }> {
    return this.userImportExport.exportKinerjaReportToGoogleDrive(
      format,
      this.getTeamStatistics.bind(this),
      this.getWorkloadDistribution.bind(this),
    );
  }
}
