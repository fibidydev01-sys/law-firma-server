// ============================================================================
// FILE: src/modules/google-drive/google-drive.service.ts
// Google Drive API Service - Handle upload, download, delete
// Supports both OAuth (admin's Drive) and Service Account modes
// ============================================================================
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import { Readable } from 'stream';

export interface UploadFileOptions {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  embedLink: string;
  thumbnailLink?: string;
  size?: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initializeDrive();
  }

  /**
   * Initialize Google Drive API - Try OAuth first, fallback to Service Account
   */
  private initializeDrive() {
    try {
      // Priority 1: OAuth (admin's Google Drive - RECOMMENDED)
      const oauthRefreshToken = this.configService.get<string>(
        'GOOGLE_OAUTH_REFRESH_TOKEN',
      );

      if (oauthRefreshToken) {
        this.initializeOAuth();
        return;
      }

      // Priority 2: Service Account (fallback - won't work for free Drive)
      this.initializeServiceAccount();
    } catch (error) {
      this.logger.error('❌ Failed to initialize Google Drive API');
      this.logger.error('Error details:', error.message);
      throw new BadRequestException(
        'Failed to initialize Google Drive. Check credentials.',
      );
    }
  }

  /**
   * Initialize with OAuth - Uses admin's personal Google Drive (15GB free)
   */
  private initializeOAuth() {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const refreshToken = this.configService.get<string>(
      'GOOGLE_OAUTH_REFRESH_TOKEN',
    );

    if (!clientId || !clientSecret || !refreshToken) {
      throw new BadRequestException(
        'OAuth credentials incomplete. Need CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN',
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI') ||
        'http://localhost:3000/api/v1/google-drive/oauth/callback',
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });

    this.logger.log('✅ Google Drive API initialized with OAuth');
    this.logger.log('📦 Using admin\'s Google Drive for centralized storage');
    this.logger.log('💾 15GB free quota available');

    const rootFolderId = this.configService.get<string>(
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    );
    if (rootFolderId) {
      this.logger.log(`📁 Root Folder ID: ${rootFolderId}`);
    }
  }

  /**
   * Initialize with Service Account - Legacy mode (won't work for free Drive)
   */
  private initializeServiceAccount() {
    const credentials = this.getCredentials();

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.logger.log('✅ Google Drive API initialized with Service Account');
    this.logger.log(`Service Account: ${credentials.client_email}`);
    this.logger.warn(
      '⚠️  Service Account mode: Requires Google Workspace or shared folder',
    );
  }

  /**
   * Get Google Drive credentials from environment
   */
  private getCredentials() {
    const credentialsJson = this.configService.get<string>(
      'GOOGLE_DRIVE_CREDENTIALS',
    );

    if (!credentialsJson) {
      throw new BadRequestException(
        'GOOGLE_DRIVE_CREDENTIALS not found in environment',
      );
    }

    try {
      return JSON.parse(credentialsJson);
    } catch (error) {
      throw new BadRequestException('Invalid Google Drive credentials JSON');
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(options: UploadFileOptions): Promise<GoogleDriveFile> {
    const { fileName, mimeType, buffer, folderId } = options;

    try {
      this.logger.log(`📤 Uploading file to Google Drive: ${fileName}`);

      // Get root folder ID from environment if no folderId provided
      const rootFolderId = this.configService.get<string>(
        'GOOGLE_DRIVE_ROOT_FOLDER_ID',
      );
      const targetFolderId = folderId || rootFolderId;

      // Build file metadata - folder is optional (will use root if not specified)
      const fileMetadata: any = {
        name: fileName,
      };

      if (targetFolderId) {
        fileMetadata.parents = [targetFolderId];
        this.logger.log(`📁 Uploading to folder ID: ${targetFolderId}`);
      } else {
        this.logger.log(`📁 Uploading to root folder (My Drive)`);
      }

      this.logger.log(
        `📋 File metadata: ${JSON.stringify({ name: fileName, parents: fileMetadata.parents, mimeType })}`,
      );

      const media = {
        mimeType,
        body: Readable.from(buffer),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields:
          'id, name, webViewLink, webContentLink, thumbnailLink, size, mimeType',
      });

      const file = response.data;

      // Set file permissions to 'anyone with link can edit'
      try {
        this.logger.log(`🔓 Setting public permissions for file: ${file.id}`);

        await this.drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'writer',
            type: 'anyone',
          },
        });

        this.logger.log(`✅ File is now publicly editable (anyone with link can edit)`);
      } catch (permError) {
        this.logger.error(`❌ Failed to set public permissions: ${permError.message}`);
        this.logger.warn(`⚠️  File uploaded but may not be publicly editable!`);
        this.logger.warn(`📋 Manual action: Share the file with edit access in Google Drive`);
        // Don't throw - file is uploaded successfully, just permissions might fail
      }

      this.logger.log(`✅ File uploaded successfully: ${file.id}`);

      return {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        embedLink: `https://drive.google.com/file/d/${file.id}/preview`,
        thumbnailLink: file.thumbnailLink,
        size: file.size,
      };
    } catch (error) {
      // Enhanced error logging
      this.logger.error(`Failed to upload file: ${fileName}`);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        errors: error.errors,
        response: error.response?.data,
      });

      // Provide more specific error messages
      if (error.code === 403) {
        // Check if it's storage quota issue
        if (error.message?.includes('storage quota')) {
          const credentials = this.configService.get<string>(
            'GOOGLE_DRIVE_CREDENTIALS',
          );
          let serviceAccountEmail =
            'your-service-account@project.iam.gserviceaccount.com';

          if (credentials) {
            try {
              const parsed = JSON.parse(credentials);
              serviceAccountEmail = parsed.client_email || serviceAccountEmail;
            } catch (e) {
              // Ignore parse error
            }
          }

          throw new BadRequestException(
            'Service Account has no storage quota. Please: ' +
              '1) Create a folder in YOUR Google Drive, ' +
              '2) Share it with: ' +
              serviceAccountEmail +
              ', ' +
              '3) Add folder ID to GOOGLE_DRIVE_ROOT_FOLDER_ID in .env. ' +
              'See GOOGLE_DRIVE_SHARED_FOLDER_SETUP.md for instructions.',
          );
        }

        throw new BadRequestException(
          'Google Drive API access denied. Please check: 1) API is enabled in Google Cloud Console, 2) Service account has correct permissions, 3) Folder is shared with service account',
        );
      }

      if (error.code === 401) {
        throw new BadRequestException(
          'Invalid Google Drive credentials. Please verify GOOGLE_DRIVE_CREDENTIALS in .env file',
        );
      }

      if (error.message?.includes('API has not been used')) {
        throw new BadRequestException(
          'Google Drive API is not enabled. Enable it at: https://console.cloud.google.com/apis/library/drive.googleapis.com',
        );
      }

      throw new BadRequestException(
        `Failed to upload file to Google Drive: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get file metadata from Google Drive
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields:
          'id, name, webViewLink, webContentLink, thumbnailLink, size, mimeType',
      });

      const file = response.data;

      return {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        embedLink: `https://drive.google.com/file/d/${file.id}/preview`,
        thumbnailLink: file.thumbnailLink,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to get file: ${fileId}`, error);
      throw new BadRequestException('Failed to get file from Google Drive');
    }
  }

  /**
   * Verify file permissions and accessibility
   */
  async verifyFileAccess(fileId: string): Promise<{
    isPublic: boolean;
    permissions: any[];
    embedLink: string;
    details: string;
  }> {
    try {
      // Get file permissions
      const permissionsResponse = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id, type, role, emailAddress)',
      });

      const permissions = permissionsResponse.data.permissions || [];
      const isPublic = permissions.some(
        (perm) => perm.type === 'anyone' && perm.role === 'reader',
      );

      let details = '';
      if (isPublic) {
        details = '✅ File is publicly accessible (anyone with link can view)';
      } else {
        details =
          '❌ File is NOT public. Permissions: ' +
          permissions.map((p) => `${p.type}:${p.role}`).join(', ');
      }

      this.logger.log(`🔍 File ${fileId} access check: ${details}`);

      return {
        isPublic,
        permissions,
        embedLink: `https://drive.google.com/file/d/${fileId}/preview`,
        details,
      };
    } catch (error) {
      this.logger.error(`Failed to verify file access: ${fileId}`, error);
      throw new BadRequestException('Failed to verify file permissions');
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from Google Drive: ${fileId}`);

      await this.drive.files.delete({
        fileId,
      });

      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileId}`, error);
      throw new BadRequestException('Failed to delete file from Google Drive');
    }
  }

  /**
   * Create folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      this.logger.log(`Creating folder in Google Drive: ${folderName}`);

      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
      });

      const folderId = response.data.id;
      this.logger.log(`Folder created successfully: ${folderId}`);

      return folderId;
    } catch (error) {
      this.logger.error(`Failed to create folder: ${folderName}`, error);
      throw new BadRequestException('Failed to create folder in Google Drive');
    }
  }

  /**
   * Get or create folder for a perkara
   */
  async getOrCreatePerkaraFolder(
    nomorPerkara: string,
    parentFolderId?: string,
  ): Promise<string> {
    try {
      // Search for existing folder
      const query = `name='${nomorPerkara}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0) {
        // Folder exists, return its ID
        return response.data.files[0].id;
      }

      // Folder doesn't exist, create it
      return await this.createFolder(nomorPerkara, parentFolderId);
    } catch (error) {
      this.logger.error(
        `Failed to get or create perkara folder: ${nomorPerkara}`,
        error,
      );
      throw new BadRequestException('Failed to manage perkara folder');
    }
  }

  /**
   * Test Google Drive connection and permissions
   * Returns diagnostic information about the setup
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      this.logger.log('Testing Google Drive API connection...');

      // Try to get info about the Drive
      const response = await this.drive.about.get({
        fields: 'user, storageQuota',
      });

      this.logger.log('✅ Google Drive connection successful');

      return {
        success: true,
        message: 'Google Drive API connection successful',
        details: {
          user: response.data.user,
          storageQuota: response.data.storageQuota,
        },
      };
    } catch (error) {
      this.logger.error('❌ Google Drive connection test failed');
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        errors: error.errors,
      });

      return {
        success: false,
        message: 'Google Drive API connection failed',
        details: {
          error: error.message,
          code: error.code,
          hint: this.getErrorHint(error),
        },
      };
    }
  }

  /**
   * Get helpful hint based on error
   */
  private getErrorHint(error: any): string {
    if (error.code === 403) {
      return 'API not enabled. Enable Google Drive API at: https://console.cloud.google.com/apis/library/drive.googleapis.com';
    }

    if (error.code === 401) {
      return 'Invalid credentials. Check GOOGLE_DRIVE_CREDENTIALS in .env file';
    }

    if (error.message?.includes('API has not been used')) {
      return 'Enable Google Drive API in Google Cloud Console';
    }

    return 'Check credentials and API settings';
  }

  /**
   * Test folder access and permissions
   */
  async testFolderAccess(folderId?: string): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    const targetFolderId =
      folderId || this.configService.get<string>('GOOGLE_DRIVE_ROOT_FOLDER_ID');

    if (!targetFolderId) {
      return {
        success: false,
        message: 'No folder ID provided',
        details: {
          error: 'GOOGLE_DRIVE_ROOT_FOLDER_ID not set in .env',
        },
      };
    }

    try {
      this.logger.log(`Testing folder access: ${targetFolderId}`);

      // Try to get folder metadata
      const folder = await this.drive.files.get({
        fileId: targetFolderId,
        fields: 'id, name, mimeType, permissions, capabilities',
      });

      // Try to list files in folder
      const files = await this.drive.files.list({
        q: `'${targetFolderId}' in parents`,
        pageSize: 5,
        fields: 'files(id, name)',
      });

      this.logger.log('✅ Folder access test successful');

      return {
        success: true,
        message: 'Folder access verified',
        details: {
          folderId: folder.data.id,
          folderName: folder.data.name,
          mimeType: folder.data.mimeType,
          capabilities: folder.data.capabilities,
          filesInFolder: files.data.files?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error('❌ Folder access test failed');
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
      });

      let hint = 'Unknown error';
      if (error.code === 404) {
        hint =
          'Folder not found. Check folder ID is correct: ' + targetFolderId;
      } else if (error.code === 403) {
        hint =
          'Permission denied. Make sure folder is shared with service account with Editor permission';
      }

      return {
        success: false,
        message: 'Folder access test failed',
        details: {
          error: error.message,
          code: error.code,
          folderId: targetFolderId,
          hint: hint,
        },
      };
    }
  }

  /**
   * Download file from Google Drive as Buffer
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      this.logger.log(`📥 Downloading file from Google Drive: ${fileId}`);

      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'arraybuffer' },
      );

      const buffer = Buffer.from(response.data as ArrayBuffer);

      this.logger.log(
        `✅ File downloaded successfully: ${buffer.length} bytes`,
      );

      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file: ${fileId}`, error);
      throw new BadRequestException(
        'Failed to download file from Google Drive',
      );
    }
  }

  /**
   * List files in Google Drive (optionally filter by folder and mime type)
   */
  async listFiles(options?: {
    folderId?: string;
    mimeType?: string;
    nameContains?: string;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
  }>> {
    try {
      const {
        folderId,
        mimeType,
        nameContains,
        pageSize = 100,
      } = options || {};

      // Build query
      const queryParts: string[] = ['trashed=false'];

      if (folderId) {
        queryParts.push(`'${folderId}' in parents`);
      }

      if (mimeType) {
        queryParts.push(`mimeType='${mimeType}'`);
      }

      if (nameContains) {
        queryParts.push(`name contains '${nameContains}'`);
      }

      const query = queryParts.join(' and ');

      this.logger.log(`📂 Listing files with query: ${query}`);

      const response = await this.drive.files.list({
        q: query,
        pageSize,
        orderBy: 'modifiedTime desc',
        fields:
          'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
      });

      const files = response.data.files || [];

      this.logger.log(`✅ Found ${files.length} files`);

      return files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size || '0',
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      }));
    } catch (error) {
      this.logger.error('Failed to list files', error);
      throw new BadRequestException('Failed to list files from Google Drive');
    }
  }
}
