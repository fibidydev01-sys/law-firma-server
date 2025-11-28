// ============================================================================
// FILE: server/src/modules/tim-perkara/tim-perkara.module.ts
// ✅ FIXED: Removed circular dependency, only import what we need
// ============================================================================
import { Module } from '@nestjs/common';
import { TimPerkaraService } from './tim-perkara.service';
import { TimPerkaraController } from './tim-perkara.controller';
// ✅ Import PerkaraModule untuk akses ke PerkaraService
import { PerkaraModule } from '../perkara/perkara.module';

@Module({
  imports: [PerkaraModule], // ✅ Normal import, no forwardRef needed
  controllers: [TimPerkaraController],
  providers: [TimPerkaraService],
  exports: [TimPerkaraService],
})
export class TimPerkaraModule {}
