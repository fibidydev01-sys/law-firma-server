// ===== FILE: src/modules/tugas/tugas.module.ts =====
import { Module } from '@nestjs/common';
import { TugasService } from './tugas.service';
import { TugasController } from './tugas.controller';
import { PerkaraModule } from '../perkara/perkara.module';

@Module({
  imports: [PerkaraModule], // ✅ Import for cache invalidation
  controllers: [TugasController],
  providers: [TugasService],
  exports: [TugasService],
})
export class TugasModule {}
