// ============================================================================
// FILE: server/src/modules/log-aktivitas/log-aktivitas.module.ts
// ============================================================================

import { Module } from '@nestjs/common';
import { LogAktivitasService } from './log-aktivitas.service';
import { LogAktivitasController } from './log-aktivitas.controller';

@Module({
  controllers: [LogAktivitasController],
  providers: [LogAktivitasService],
  exports: [LogAktivitasService],
})
export class LogAktivitasModule {}
