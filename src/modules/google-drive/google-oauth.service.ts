// ============================================================================
// FILE: src/modules/google-drive/google-oauth.service.ts
// Google OAuth 2.0 Service - Handle user authentication for Google Drive
// ============================================================================
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initializeOAuth();
  }

  /**
   * Initialize OAuth 2.0 client
   */
  private initializeOAuth() {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const redirectUri = this.configService.get<string>(
      'GOOGLE_OAUTH_REDIRECT_URI',
    );

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.warn(
        'Google OAuth credentials not configured. OAuth flow will not work.',
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    this.logger.log('✅ Google OAuth 2.0 initialized successfully');
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    if (!this.oauth2Client) {
      throw new BadRequestException(
        'Google OAuth not configured. Please set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI in .env',
      );
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
      state: userId, // Pass user ID in state for callback
      prompt: 'consent', // Force consent to get refresh token
    });

    this.logger.log(`Generated OAuth URL for user: ${userId}`);
    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    code: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Handling OAuth callback for user: ${userId}`);

      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      this.logger.log(`Received tokens for user: ${userId}`);

      // Calculate token expiry time
      const expiresAt = new Date();
      if (tokens.expiry_date) {
        expiresAt.setTime(tokens.expiry_date);
      } else {
        // Default 1 hour if not provided
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      // Store tokens in database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          google_drive_access_token: tokens.access_token,
          google_drive_refresh_token: tokens.refresh_token,
          google_drive_token_expires: expiresAt,
          google_drive_connected: true,
        },
      });

      this.logger.log(`✅ Tokens stored successfully for user: ${userId}`);

      return {
        success: true,
        message: 'Google Drive connected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to handle OAuth callback: ${error.message}`);
      throw new BadRequestException(
        'Failed to connect Google Drive. Please try again.',
      );
    }
  }

  /**
   * Get valid access token for user (refresh if expired)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        google_drive_access_token: true,
        google_drive_refresh_token: true,
        google_drive_token_expires: true,
        google_drive_connected: true,
      },
    });

    if (!user || !user.google_drive_connected) {
      throw new BadRequestException(
        'Google Drive not connected. Please connect your Google Drive account first.',
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = user.google_drive_token_expires;

    if (!expiresAt || now >= expiresAt) {
      // Token expired, refresh it
      this.logger.log(`Token expired for user ${userId}, refreshing...`);

      if (!user.google_drive_refresh_token) {
        throw new Error('No refresh token available. Please reconnect Google Drive.');
      }

      return await this.refreshAccessToken(userId, user.google_drive_refresh_token);
    }

    if (!user.google_drive_access_token) {
      throw new Error('No access token available. Please reconnect Google Drive.');
    }

    return user.google_drive_access_token;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(
    userId: string,
    refreshToken: string,
  ): Promise<string> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Calculate new expiry time
      const expiresAt = new Date();
      if (credentials.expiry_date) {
        expiresAt.setTime(credentials.expiry_date);
      } else {
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      // Update tokens in database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          google_drive_access_token: credentials.access_token,
          google_drive_token_expires: expiresAt,
        },
      });

      this.logger.log(`✅ Token refreshed successfully for user: ${userId}`);

      return credentials.access_token;
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error.message}`);

      // Refresh failed, disconnect user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          google_drive_connected: false,
          google_drive_access_token: null,
          google_drive_refresh_token: null,
          google_drive_token_expires: null,
        },
      });

      throw new BadRequestException(
        'Failed to refresh Google Drive access. Please reconnect your account.',
      );
    }
  }

  /**
   * Disconnect Google Drive for user
   */
  async disconnect(userId: string): Promise<{ success: boolean; message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        google_drive_connected: false,
        google_drive_access_token: null,
        google_drive_refresh_token: null,
        google_drive_token_expires: null,
      },
    });

    this.logger.log(`Google Drive disconnected for user: ${userId}`);

    return {
      success: true,
      message: 'Google Drive disconnected successfully',
    };
  }

  /**
   * Check if user has Google Drive connected
   */
  async isConnected(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { google_drive_connected: true },
    });

    return user?.google_drive_connected || false;
  }
}
