// ===== FILE: user-management.service.ts =====
// Handles: Password reset, status toggle, avatar upload/delete, invitation emails
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateLogAktivitasData, UserEntity } from '../../../common/interfaces';

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
export class UserManagementService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async resetUserPassword(id: string): Promise<{ temporary_password: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const temporaryPassword = crypto.randomBytes(5).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await this.prisma.logAktivitas.create({
      data: {
        user_id: id,
        aksi: 'RESET_PASSWORD',
        jenis_entitas: 'user',
        id_entitas: id,
        detail: {
          email: user.email,
          reset_by: 'admin',
        },
      },
    });

    console.log('✅ Password reset for user:', user.email);

    return { temporary_password: temporaryPassword };
  }

  async toggleUserStatus(
    id: string,
    active: boolean,
  ): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { is_active: active },
      select: userSelectWithoutPassword,
    });

    await this.prisma.logAktivitas.create({
      data: {
        user_id: id,
        aksi: active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        jenis_entitas: 'user',
        id_entitas: id,
        detail: {
          email: updatedUser.email,
          status: active ? 'active' : 'inactive',
        },
      },
    });

    console.log(
      `✅ User ${active ? 'activated' : 'deactivated'}:`,
      updatedUser.email,
    );

    return updatedUser;
  }

  async uploadAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<{ avatar_url: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, avatar_url: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (user.avatar_url) {
      await this.storage.deleteFile(user.avatar_url);
    }

    const filepath = await this.storage.uploadFile(file, 'avatars', id);

    await this.prisma.user.update({
      where: { id },
      data: { avatar_url: filepath },
    });

    await this.prisma.logAktivitas.create({
      data: {
        user_id: id,
        aksi: 'UPLOAD_AVATAR',
        jenis_entitas: 'user',
        id_entitas: id,
        detail: {
          email: user.email,
          avatar_url: filepath,
        },
      },
    });

    console.log('✅ Avatar uploaded for user:', user.email);

    return { avatar_url: this.storage.getFileUrl(filepath) };
  }

  async deleteAvatar(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, avatar_url: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.avatar_url) {
      throw new BadRequestException('User tidak memiliki avatar');
    }

    await this.storage.deleteFile(user.avatar_url);

    await this.prisma.user.update({
      where: { id },
      data: { avatar_url: null },
    });

    await this.prisma.logAktivitas.create({
      data: {
        user_id: id,
        aksi: 'DELETE_AVATAR',
        jenis_entitas: 'user',
        id_entitas: id,
        detail: { email: user.email },
      },
    });

    console.log('✅ Avatar deleted for user:', user.email);
  }

  async sendInvitationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, nama_lengkap: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const temporaryPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    const loginUrl =
      this.config.get<string>('app.frontendUrl', 'http://localhost:3001') +
      '/login';

    const emailResult = await this.email.sendInvitationEmail({
      to: user.email,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      temporaryPassword,
      loginUrl,
    });

    await this.prisma.logAktivitas.create({
      data: {
        user_id: id,
        aksi: 'SEND_INVITATION',
        jenis_entitas: 'user',
        id_entitas: id,
        detail: {
          email: user.email,
          success: emailResult.success,
        },
      },
    });

    if (emailResult.success) {
      console.log('✅ Invitation email sent to:', user.email);
      return {
        success: true,
        message: 'Invitation email sent successfully',
      };
    } else {
      return {
        success: false,
        message: 'Failed to send invitation email',
      };
    }
  }

  async resendInvitationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendInvitationEmail(id);
  }
}
