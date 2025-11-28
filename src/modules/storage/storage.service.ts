// ============================================================================
// FILE: server/src/modules/storage/storage.service.ts
// ============================================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadPath: string;
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly maxFileSize = 2 * 1024 * 1024; // 2MB

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>(
      'UPLOAD_PATH',
      './uploads',
    );
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File tidak boleh kosong');
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan: JPG, PNG, GIF, atau WEBP',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Ukuran file maksimal ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Upload file to server
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    prefix?: string,
  ): Promise<string> {
    this.validateImageFile(file);

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = prefix
      ? `${prefix}_${timestamp}${ext}`
      : `${timestamp}${ext}`;

    const folderPath = path.join(this.uploadPath, folder);

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filepath = path.join(folderPath, filename);

    // Write file
    await fs.promises.writeFile(filepath, file.buffer);

    // Return relative path
    return path.join(folder, filename).replace(/\\/g, '/');
  }

  /**
   * Delete file from server
   */
  async deleteFile(filepath: string): Promise<void> {
    if (!filepath) return;

    const fullPath = path.join(this.uploadPath, filepath);

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        console.log('✅ File deleted:', fullPath);
      }
    } catch (error) {
      console.error('⚠️  Failed to delete file:', error);
      // Don't throw error, just log
    }
  }

  /**
   * Get public URL for file
   */
  getFileUrl(filepath: string): string {
    if (!filepath) return '';
    return `/uploads/${filepath}`;
  }

  /**
   * Check if file exists
   */
  fileExists(filepath: string): boolean {
    const fullPath = path.join(this.uploadPath, filepath);
    return fs.existsSync(fullPath);
  }
}
