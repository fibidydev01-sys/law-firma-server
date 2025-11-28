// ============================================================================
// FILE: server/src/modules/dokumen/dokumen.service.ts - WITH GOOGLE DRIVE API
// ✅ FIXED: Invalidate perkara cache after create/update/delete
// ============================================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerkaraService } from '../perkara/perkara.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreateDokumenDto } from './dto/create-dokumen.dto';
import { UpdateDokumenDto } from './dto/update-dokumen.dto';
import { QueryDokumenDto } from './dto/query-dokumen.dto';
import {
  PaginatedResult,
  DokumenWithRelations,
  DokumenDownloadResponse,
  CreateLogAktivitasData,
} from '../../common/interfaces';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class DokumenService {
  private readonly logger = new Logger(DokumenService.name);

  constructor(
    private prisma: PrismaService,
    private googleDriveService: GoogleDriveService,
    private perkaraService: PerkaraService, // ✅ Inject for cache invalidation
  ) {}

  async create(
    dto: CreateDokumenDto,
    file: Express.Multer.File,
    userId: string,
    userRole: UserRole, // ✅ ADDED for access control
  ): Promise<DokumenWithRelations> {
    if (!file) {
      throw new BadRequestException('File harus diupload');
    }

    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
      select: { id: true, nomor_perkara: true, klien_id: true }, // ✅ Need klien_id for validation
    });

    if (!perkara) {
      throw new BadRequestException('Perkara tidak ditemukan');
    }

    // 🔒 RBAC: KLIEN hanya bisa upload ke perkara mereka sendiri
    if (userRole === UserRole.klien) {
      // ✅ FIX: Look up klien_id from akses_portal_klien (user_id -> klien_id)
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (!aksesPortal || perkara.klien_id !== aksesPortal.klien_id) {
        this.logger.warn(
          `🚨 Unauthorized upload attempt: User ${userId} (klien) tried to upload to perkara ${dto.perkara_id} owned by ${perkara.klien_id}`,
        );
        throw new BadRequestException(
          'Anda tidak memiliki akses untuk upload dokumen ke perkara ini',
        );
      }
    }
    // ✅ INTERNAL STAFF: Can upload to any perkara

    // ✅ UPLOAD TO GOOGLE DRIVE (instead of local storage)
    const driveFile = await this.googleDriveService.uploadFile({
      fileName: dto.nama_dokumen || file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    // ✅ VERIFY FILE ACCESSIBILITY (for debugging)
    try {
      const accessCheck = await this.googleDriveService.verifyFileAccess(
        driveFile.id,
      );
      this.logger.log(
        `📊 File accessibility: ${accessCheck.details}`,
      );
    } catch (verifyError) {
      this.logger.warn(
        `⚠️  Could not verify file access (non-critical): ${verifyError.message}`,
      );
    }

    // ✅ SAVE METADATA + GOOGLE DRIVE LINKS (not local file path)
    const dokumen = await this.prisma.dokumenHukum.create({
      data: {
        perkara_id: dto.perkara_id,
        nama_dokumen: dto.nama_dokumen || file.originalname,
        kategori: dto.kategori,
        nomor_bukti: dto.nomor_bukti,
        folder_id: dto.folder_id || null, // ✅ Support folder organization
        // Google Drive fields
        google_drive_id: driveFile.id,
        google_drive_link: driveFile.webViewLink,
        embed_link: driveFile.embedLink,
        // Metadata
        ukuran_file: file.size,
        tipe_file: file.mimetype,
        tanggal_dokumen: dto.tanggal_dokumen,
        catatan: dto.catatan,
        diunggah_oleh: userId,
        // Legacy field (null for Google Drive files)
        file_path: null,
      },
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
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pengunggah: {
          select: {
            id: true,
            email: true,
            nama_lengkap: true,
            role: true,
            avatar_url: true,
          },
        },
        folder: {
          select: {
            id: true,
            nama_folder: true,
            warna: true,
            icon: true,
          },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPLOAD_DOKUMEN',
      jenis_entitas: 'dokumen',
      id_entitas: dokumen.id,
      detail: {
        nama_dokumen: dokumen.nama_dokumen,
        perkara_id: dto.perkara_id,
        google_drive_id: driveFile.id,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(dto.perkara_id);

    return dokumen;
  }

  // ============================================================================
  // BULK UPLOAD: Upload multiple files at once
  // ============================================================================
  async createBulk(
    dto: CreateDokumenDto,
    files: Express.Multer.File[],
    userId: string,
    userRole: UserRole,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal 1 file harus diupload');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maksimal 10 file per upload');
    }

    // Validate perkara dan RBAC (sama seperti single upload)
    const perkara = await this.prisma.perkara.findUnique({
      where: { id: dto.perkara_id },
      select: { id: true, nomor_perkara: true, klien_id: true },
    });

    if (!perkara) {
      throw new BadRequestException('Perkara tidak ditemukan');
    }

    // 🔒 RBAC: KLIEN hanya bisa upload ke perkara mereka sendiri
    if (userRole === UserRole.klien) {
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (!aksesPortal || perkara.klien_id !== aksesPortal.klien_id) {
        this.logger.warn(
          `🚨 Unauthorized bulk upload attempt: User ${userId} (klien) tried to upload to perkara ${dto.perkara_id}`,
        );
        throw new BadRequestException(
          'Anda tidak memiliki akses untuk upload dokumen ke perkara ini',
        );
      }
    }

    // Upload semua file ke Google Drive dan simpan ke database
    const uploadedDokumen: any[] = [];
    const errors: { filename: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        this.logger.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.originalname}`);

        // Upload ke Google Drive
        const driveFile = await this.googleDriveService.uploadFile({
          fileName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        });

        // Save metadata ke database
        const dokumen = await this.prisma.dokumenHukum.create({
          data: {
            perkara_id: dto.perkara_id,
            nama_dokumen: file.originalname,
            kategori: dto.kategori,
            nomor_bukti: dto.nomor_bukti,
            google_drive_id: driveFile.id,
            google_drive_link: driveFile.webViewLink,
            embed_link: driveFile.embedLink,
            ukuran_file: file.size,
            tipe_file: file.mimetype,
            tanggal_dokumen: dto.tanggal_dokumen,
            catatan: dto.catatan,
            diunggah_oleh: userId,
            file_path: null,
          },
        });

        uploadedDokumen.push(dokumen);

        // Log aktivitas
        await this.prisma.logAktivitas.create({
          data: {
            user_id: userId,
            aksi: 'BULK_UPLOAD_DOKUMEN',
            jenis_entitas: 'dokumen',
            id_entitas: dokumen.id,
            detail: {
              nama_dokumen: dokumen.nama_dokumen,
              perkara_id: dto.perkara_id,
              google_drive_id: driveFile.id,
              bulk_index: i + 1,
              total_files: files.length,
            },
          },
        });

        this.logger.log(`✅ File ${i + 1}/${files.length} uploaded successfully`);
      } catch (error) {
        this.logger.error(`❌ Failed to upload file ${i + 1}: ${file.originalname}`, error);
        errors.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    // Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(dto.perkara_id);

    return {
      success: true,
      message: `Successfully uploaded ${uploadedDokumen.length} out of ${files.length} files`,
      uploaded: uploadedDokumen.length,
      failed: errors.length,
      total: files.length,
      dokumen: uploadedDokumen,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ============================================================================
  // ✅ RBAC FILTERING APPLIED HERE!
  // ============================================================================
  async findAll(
    query: QueryDokumenDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<DokumenWithRelations>> {
    const {
      page = 1,
      limit = 10,
      search,
      kategori,
      perkara_id,
      folder_id,
      sortBy = 'tanggal_upload',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.DokumenHukumWhereInput = {};

    // 🔥 RBAC: DATA FILTERING BASED ON USER ROLE (OPSI A: SIMPLE MODEL)
    if (userRole === UserRole.klien) {
      // ✅ KLIEN: Hanya dokumen dari perkara mereka sendiri
      // Step 1: Get klien_id from akses_portal_klien (user_id -> klien_id)
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (aksesPortal) {
        // Step 2: Get perkara IDs for this klien
        const perkaraIds = await this.prisma.perkara.findMany({
          where: { klien_id: aksesPortal.klien_id },
          select: { id: true },
        });

        where.perkara_id = {
          in: perkaraIds.map((p) => p.id),
        };
      } else {
        // No klien record linked - return empty (no access)
        where.perkara_id = { in: [] };
      }
    }
    // ✅ INTERNAL STAFF (admin, partner, advokat, paralegal, staff): FULL ACCESS
    // No additional filter needed - they can see ALL documents

    // Apply search & filters
    if (search) {
      const searchCondition: Prisma.DokumenHukumWhereInput = {
        OR: [
          { nama_dokumen: { contains: search, mode: 'insensitive' } },
          { nomor_bukti: { contains: search, mode: 'insensitive' } },
        ],
      };

      // Safe way to add to AND condition
      if (where.AND) {
        if (Array.isArray(where.AND)) {
          where.AND.push(searchCondition);
        } else {
          where.AND = [where.AND, searchCondition];
        }
      } else if (where.perkara || where.perkara_id) {
        where.AND = [searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    if (kategori) where.kategori = kategori;
    if (perkara_id) where.perkara_id = perkara_id;

    // 📁 FOLDER FILTERING: Support both specific folder and root (no folder)
    if (folder_id !== undefined) {
      if (folder_id === 'null' || folder_id === null) {
        // Filter for documents without folder (root level)
        where.folder_id = null;
      } else {
        // Filter for specific folder
        where.folder_id = folder_id;
      }
    }

    const orderBy: Prisma.DokumenHukumOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.dokumenHukum.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
                  email: true,
                  telepon: true,
                  jenis_klien: true,
                },
              },
            },
          },
          pengunggah: {
            select: {
              id: true,
              email: true,
              nama_lengkap: true,
              role: true,
              avatar_url: true,
            },
          },
          folder: {
            select: {
              id: true,
              nama_folder: true,
              warna: true,
              icon: true,
            },
          },
        },
      }),
      this.prisma.dokumenHukum.count({ where }),
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

  // ============================================================================
  // GET STATS (with RBAC filtering)
  // ============================================================================
  async getStats(
    userId: string,
    userRole: UserRole,
  ): Promise<{
    total_dokumen: number;
    dokumen_bulan_ini: number;
    dokumen_minggu_ini: number;
  }> {
    const where: Prisma.DokumenHukumWhereInput = {};

    // 🔥 RBAC: Apply same filtering as findAll
    if (userRole === UserRole.klien) {
      // ✅ KLIEN: Hanya dokumen dari perkara mereka sendiri
      // Step 1: Get klien_id from akses_portal_klien (user_id -> klien_id)
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      if (aksesPortal) {
        // Step 2: Get perkara IDs for this klien
        const perkaraIds = await this.prisma.perkara.findMany({
          where: { klien_id: aksesPortal.klien_id },
          select: { id: true },
        });

        where.perkara_id = {
          in: perkaraIds.map((p) => p.id),
        };
      } else {
        // No klien record linked - return empty (no access)
        where.perkara_id = { in: [] };
      }
    }
    // ✅ INTERNAL STAFF: FULL ACCESS (no filter)

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

    const [total_dokumen, dokumen_bulan_ini, dokumen_minggu_ini] = await Promise.all([
      // Total documents (with RBAC filter)
      this.prisma.dokumenHukum.count({ where }),

      // Documents this month
      this.prisma.dokumenHukum.count({
        where: {
          ...where,
          tanggal_upload: {
            gte: startOfMonth,
          },
        },
      }),

      // Documents this week
      this.prisma.dokumenHukum.count({
        where: {
          ...where,
          tanggal_upload: {
            gte: startOfWeek,
          },
        },
      }),
    ]);

    return {
      total_dokumen,
      dokumen_bulan_ini,
      dokumen_minggu_ini,
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<DokumenWithRelations> {
    const dokumen = await this.prisma.dokumenHukum.findUnique({
      where: { id },
      include: {
        perkara: {
          select: {
            id: true,
            nomor_perkara: true,
            judul: true,
            klien_id: true, // ✅ Need this for access check
            klien: {
              select: {
                id: true,
                nama: true,
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pengunggah: {
          select: {
            id: true,
            email: true,
            nama_lengkap: true,
            role: true,
            avatar_url: true,
          },
        },
        folder: {
          select: {
            id: true,
            nama_folder: true,
            warna: true,
            icon: true,
          },
        },
      },
    });

    if (!dokumen) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    // 🔒 RBAC: ACCESS CONTROL (OPSI A: SIMPLE MODEL)
    if (userRole === UserRole.klien) {
      // ✅ FIX: Look up klien_id from akses_portal_klien (user_id -> klien_id)
      const aksesPortal = await this.prisma.aksesPortalKlien.findFirst({
        where: { user_id: userId },
        select: { klien_id: true },
      });

      // ✅ KLIEN: Hanya bisa akses dokumen dari perkara mereka sendiri
      if (!aksesPortal || dokumen.perkara.klien_id !== aksesPortal.klien_id) {
        this.logger.warn(
          `🚨 Unauthorized access attempt: User ${userId} (klien) tried to access document ${id} belonging to ${dokumen.perkara.klien_id}`,
        );
        throw new NotFoundException('Dokumen tidak ditemukan');
      }
    }
    // ✅ INTERNAL STAFF: Full access (no check needed)

    return dokumen;
  }

  async download(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<DokumenDownloadResponse> {
    const dokumen = await this.findOne(id, userId, userRole);

    // ✅ Return Google Drive download link (not local file)
    if (!dokumen.google_drive_link) {
      throw new NotFoundException(
        'File tidak tersedia. Google Drive link tidak ditemukan.',
      );
    }

    return {
      file_path: dokumen.google_drive_link, // Google Drive download URL
      nama_dokumen: dokumen.nama_dokumen,
    };
  }

  async update(
    id: string,
    dto: UpdateDokumenDto,
    userId: string,
    userRole: UserRole,
  ): Promise<DokumenWithRelations> {
    await this.findOne(id, userId, userRole);

    const updateData: Prisma.DokumenHukumUpdateInput = { ...dto };

    const dokumen = await this.prisma.dokumenHukum.update({
      where: { id },
      data: updateData,
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
                email: true,
                telepon: true,
                jenis_klien: true,
              },
            },
          },
        },
        pengunggah: {
          select: {
            id: true,
            email: true,
            nama_lengkap: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'UPDATE_DOKUMEN',
      jenis_entitas: 'dokumen',
      id_entitas: dokumen.id,
      detail: { nama_dokumen: dokumen.nama_dokumen },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(dokumen.perkara.id);

    return dokumen;
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const dokumen = await this.findOne(id, userId, userRole);

    // ✅ Delete from Google Drive if exists
    if (dokumen.google_drive_id) {
      try {
        await this.googleDriveService.deleteFile(dokumen.google_drive_id);
      } catch (error) {
        // Log error but continue with DB deletion
        console.error(
          `Failed to delete file from Google Drive: ${dokumen.google_drive_id}`,
          error,
        );
      }
    }

    await this.prisma.dokumenHukum.delete({
      where: { id },
    });

    const logData: CreateLogAktivitasData = {
      user_id: userId,
      aksi: 'DELETE_DOKUMEN',
      jenis_entitas: 'dokumen',
      id_entitas: id,
      detail: {
        nama_dokumen: dokumen.nama_dokumen,
        google_drive_id: dokumen.google_drive_id,
      },
    };

    await this.prisma.logAktivitas.create({
      data: logData,
    });

    // ✅ FIX: Invalidate perkara cache
    await this.perkaraService.invalidatePerkaraCache(dokumen.perkara.id);

    return { message: 'Dokumen berhasil dihapus' };
  }

  // ============================================================================
  // FOLDER OPERATIONS: Move and Copy
  // ============================================================================
  async moveToFolder(
    id: string,
    folderId: string | null,
    userId: string,
    userRole: UserRole,
  ) {
    const dokumen = await this.findOne(id, userId, userRole);

    // If folder_id provided, verify folder exists and in same perkara
    if (folderId) {
      const folder = await this.prisma.folderDokumen.findUnique({
        where: { id: folderId },
        select: { id: true, perkara_id: true, nama_folder: true },
      });

      if (!folder) {
        throw new BadRequestException('Folder tidak ditemukan');
      }

      if (folder.perkara_id !== dokumen.perkara_id) {
        throw new BadRequestException('Folder harus di perkara yang sama');
      }
    }

    const updated = await this.prisma.dokumenHukum.update({
      where: { id },
      data: { folder_id: folderId },
      include: {
        folder: {
          select: {
            id: true,
            nama_folder: true,
          },
        },
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        user_id: userId,
        aksi: 'MOVE_DOKUMEN',
        jenis_entitas: 'dokumen',
        id_entitas: id,
        detail: {
          nama_dokumen: dokumen.nama_dokumen,
          folder_id: folderId,
          folder_name: updated.folder?.nama_folder || 'Root',
        },
      },
    });

    this.logger.log(`Dokumen ${id} moved to folder ${folderId || 'root'}`);

    return {
      success: true,
      message: `Dokumen dipindahkan ke ${updated.folder?.nama_folder || 'Root'}`,
      dokumen: updated,
    };
  }

  async copyDocument(
    id: string,
    folderId: string | null | undefined,
    newName: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const original = await this.findOne(id, userId, userRole);

    // Verify folder if provided
    if (folderId) {
      const folder = await this.prisma.folderDokumen.findUnique({
        where: { id: folderId },
        select: { id: true, perkara_id: true },
      });

      if (!folder) {
        throw new BadRequestException('Folder tidak ditemukan');
      }

      if (folder.perkara_id !== original.perkara_id) {
        throw new BadRequestException('Folder harus di perkara yang sama');
      }
    }

    // Create copy in database (file already in Google Drive, just reference it)
    const copy = await this.prisma.dokumenHukum.create({
      data: {
        perkara_id: original.perkara_id,
        folder_id: folderId === undefined ? original.folder_id : folderId,
        nama_dokumen: newName || `${original.nama_dokumen} (Copy)`,
        kategori: original.kategori,
        nomor_bukti: original.nomor_bukti,
        google_drive_id: original.google_drive_id, // Same Drive file
        google_drive_link: original.google_drive_link,
        embed_link: original.embed_link,
        ukuran_file: original.ukuran_file,
        tipe_file: original.tipe_file,
        tanggal_dokumen: original.tanggal_dokumen,
        catatan: original.catatan,
        diunggah_oleh: userId,
        file_path: null,
      },
      include: {
        folder: {
          select: {
            id: true,
            nama_folder: true,
          },
        },
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        user_id: userId,
        aksi: 'COPY_DOKUMEN',
        jenis_entitas: 'dokumen',
        id_entitas: copy.id,
        detail: {
          original_id: id,
          original_name: original.nama_dokumen,
          copy_name: copy.nama_dokumen,
          folder_id: copy.folder_id,
        },
      },
    });

    this.logger.log(`Dokumen ${id} copied to ${copy.id}`);

    return {
      success: true,
      message: 'Dokumen berhasil dicopy',
      dokumen: copy,
    };
  }
}
