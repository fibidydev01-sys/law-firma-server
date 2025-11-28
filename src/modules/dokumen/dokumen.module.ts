// ===== FILE: src/modules/dokumen/dokumen.module.ts =====
import { Module } from '@nestjs/common';
import { DokumenService } from './dokumen.service';
import { DokumenController } from './dokumen.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { PerkaraModule } from '../perkara/perkara.module';

@Module({
  imports: [GoogleDriveModule, PerkaraModule], // ✅ Import for cache invalidation
  controllers: [DokumenController],
  providers: [DokumenService],
  exports: [DokumenService],
})
export class DokumenModule {}
