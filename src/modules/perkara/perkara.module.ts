// ============================================================================
// FILE: server/src/modules/perkara/perkara.module.ts
// ✅ FIXED: Removed circular dependency
// ============================================================================
import { Module } from '@nestjs/common';
import { PerkaraService } from './perkara.service';
import { PerkaraController } from './perkara.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [GoogleDriveModule], // ✅ Import GoogleDriveModule for report export
  controllers: [PerkaraController],
  providers: [PerkaraService],
  exports: [PerkaraService], // ✅ Export service agar bisa dipakai module lain
})
export class PerkaraModule {}
