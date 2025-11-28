// ============================================================================
// FILE: src/modules/google-drive/google-drive.module.ts
// Google Drive Module - Supports OAuth and Service Account
// ============================================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveOAuthController } from './google-drive-oauth.controller';

@Module({
  imports: [ConfigModule],
  controllers: [GoogleDriveOAuthController],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
