import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { QueryFolderDto } from './dto/query-folder.dto';

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFolderDto, userId: string, userRole: UserRole) {
    // Verify perkara exists
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
      select: { id: true, klien_id: true },
    });

    if (!perkara) {
      throw new BadRequestException('Perkara tidak ditemukan');
    }

    // RBAC: Klien hanya bisa create folder untuk perkara mereka
    if (userRole === UserRole.klien) {
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (!aksesPortal || perkara.klien_id !== aksesPortal.klien_id) {
        throw new BadRequestException('Anda tidak memiliki akses ke perkara ini');
      }
    }

    // If parent_id specified, verify parent exists and belongs to same perkara
    if (dto.parent_id) {
      const parent = await this.prisma.folderDokumen.findUnique({
        where: { id: dto.parent_id },
        select: { perkara_id: true },
      });

      if (!parent) {
        throw new BadRequestException('Parent folder tidak ditemukan');
      }

      if (parent.perkara_id !== dto.perkara_id) {
        throw new BadRequestException('Parent folder harus di perkara yang sama');
      }
    }

    const folder = await this.prisma.folderDokumen.create({
      data: {
        perkara_id: dto.perkara_id,
        nama_folder: dto.nama_folder,
        parent_id: dto.parent_id,
        warna: dto.warna,
        icon: dto.icon,
        urutan: dto.urutan || 0,
        dibuat_oleh: userId,
      },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
        pembuat: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            nama_folder: true,
          },
        },
        _count: {
          select: {
            children: true,
            dokumen: true,
          },
        },
      },
    });

    this.logger.log(`Folder created: ${folder.nama_folder} for perkara ${dto.perkara_id}`);

    return folder;
  }

  async findAll(query: QueryFolderDto, userId: string, userRole: UserRole) {
    const where: any = {};

    if (query.perkara_id) {
      where.perkara_id = query.perkara_id;
    }

    if (query.parent_id !== undefined) {
      where.parent_id = query.parent_id === 'null' ? null : query.parent_id;
    }

    // RBAC: Klien hanya bisa lihat folder dari perkara mereka
    if (userRole === UserRole.klien) {
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (aksesPortal) {
        const perkaraIds = await this.prisma.perkara.findMany({
          where: { klien_id: aksesPortal.klien_id },
          select: { id: true },
        });

        where.perkara_id = { in: perkaraIds.map(p => p.id) };
      } else {
        where.perkara_id = 'no-access';
      }
    }

    const folders = await this.prisma.folderDokumen.findMany({
      where,
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
        pembuat: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            nama_folder: true,
          },
        },
        _count: {
          select: {
            children: true,
            dokumen: true,
          },
        },
      },
      orderBy: [
        { urutan: 'asc' },
        { nama_folder: 'asc' },
      ],
    });

    return folders;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const folder = await this.prisma.folderDokumen.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            klien_id: true,
          },
        },
        pembuat: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            nama_folder: true,
          },
        },
        children: {
          select: {
            id: true,
            nama_folder: true,
            warna: true,
            icon: true,
            urutan: true,
            _count: {
              select: {
                children: true,
                dokumen: true,
              },
            },
          },
          orderBy: [
            { urutan: 'asc' },
            { nama_folder: 'asc' },
          ],
        },
        dokumen: {
          select: {
            id: true,
            nama_dokumen: true,
            kategori: true,
            ukuran_file: true,
            tipe_file: true,
            tanggal_upload: true,
          },
          orderBy: {
            tanggal_upload: 'desc',
          },
        },
        _count: {
          select: {
            children: true,
            dokumen: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder tidak ditemukan');
    }

    // RBAC: Klien check access
    if (userRole === UserRole.klien) {
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (!aksesPortal || folder.perkara.klien_id !== aksesPortal.klien_id) {
        throw new NotFoundException('Folder tidak ditemukan');
      }
    }

    return folder;
  }

  async update(id: string, dto: UpdateFolderDto, userId: string, userRole: UserRole) {
    const folder = await this.findOne(id, userId, userRole);

    // RBAC: Only creator or staff can update
    if (userRole === UserRole.klien && folder.dibuat_oleh !== userId) {
      throw new BadRequestException('Anda tidak memiliki akses untuk update folder ini');
    }

    const updated = await this.prisma.folderDokumen.update({
      where: { id },
      data: {
        nama_folder: dto.nama_folder,
        parent_id: dto.parent_id,
        warna: dto.warna,
        icon: dto.icon,
        urutan: dto.urutan,
      },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
          },
        },
        _count: {
          select: {
            children: true,
            dokumen: true,
          },
        },
      },
    });

    this.logger.log(`Folder updated: ${id}`);

    return updated;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const folder = await this.findOne(id, userId, userRole);

    // RBAC: Only creator or staff can delete
    if (userRole === UserRole.klien && folder.dibuat_oleh !== userId) {
      throw new BadRequestException('Anda tidak memiliki akses untuk hapus folder ini');
    }

    // Move all documents to root (folder_id = null)
    await this.prisma.dokumenHukum.updateMany({
      where: { folder_id: id },
      data: { folder_id: null },
    });

    // Move all subfolders to parent (or root if no parent)
    await this.prisma.folderDokumen.updateMany({
      where: { parent_id: id },
      data: { parent_id: folder.parent_id },
    });

    await this.prisma.folderDokumen.delete({
      where: { id },
    });

    this.logger.log(`Folder deleted: ${id}`);

    return { success: true, message: 'Folder berhasil dihapus' };
  }

  async getTree(perkaraId: string, userId: string, userRole: UserRole) {
    // Verify access to perkara
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: perkaraId },
      select: { id: true, klien_id: true },
    });

    if (!perkara) {
      throw new NotFoundException('Perkara tidak ditemukan');
    }

    // RBAC check
    if (userRole === UserRole.klien) {
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (!aksesPortal || perkara.klien_id !== aksesPortal.klien_id) {
        throw new NotFoundException('Perkara tidak ditemukan');
      }
    }

    // Get all folders for this perkara with document statistics
    const folders = await this.prisma.folderDokumen.findMany({
      where: { perkara_id: perkaraId },
      include: {
        _count: {
          select: {
            children: true,
            dokumen: true,
          },
        },
        dokumen: {
          select: {
            ukuran_file: true,
            tanggal_upload: true,
            tipe_file: true,
            kategori: true,
          },
          orderBy: {
            tanggal_upload: 'desc',
          },
        },
      },
      orderBy: [
        { urutan: 'asc' },
        { nama_folder: 'asc' },
      ],
    });

    // Calculate statistics for each folder
    const foldersWithStats = folders.map(folder => {
      const dokumen = folder.dokumen;

      // Calculate total size
      const totalSize = dokumen.reduce((sum, doc) => sum + (doc.ukuran_file || 0), 0);

      // Get last upload date
      const lastUpload = dokumen.length > 0 ? dokumen[0].tanggal_upload : null;

      // Count file types
      const fileTypes: Record<string, number> = {};
      dokumen.forEach(doc => {
        const type = doc.tipe_file || 'unknown';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });

      // Count categories
      const categories: Record<string, number> = {};
      dokumen.forEach(doc => {
        const category = doc.kategori || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
      });

      // Remove dokumen from response (we don't need full dokumen data in tree)
      const { dokumen: _, ...folderWithoutDokumen } = folder;

      return {
        ...folderWithoutDokumen,
        statistics: {
          totalSize,
          lastUpload,
          fileTypes,
          categories,
        },
      };
    });

    // Build tree structure
    const buildTree = (parentId: string | null): any[] => {
      return foldersWithStats
        .filter(f => f.parent_id === parentId)
        .map(f => ({
          ...f,
          children: buildTree(f.id),
        }));
    };

    return buildTree(null);
  }
}
