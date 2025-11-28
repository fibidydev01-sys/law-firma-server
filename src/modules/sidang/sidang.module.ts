// ===== FILE: src/modules/sidang/sidang.module.ts =====
import { Module } from '@nestjs/common';
import { SidangService } from './sidang.service';
import { SidangController } from './sidang.controller';
import { PerkaraModule } from '../perkara/perkara.module';

@Module({
  imports: [PerkaraModule], // ✅ Import to access PerkaraService for cache invalidation
  controllers: [SidangController],
  providers: [SidangService],
  exports: [SidangService],
})
export class SidangModule {}
