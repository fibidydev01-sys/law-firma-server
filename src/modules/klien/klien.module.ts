// ===== FILE: src/modules/klien/klien.module.ts =====
import { Module } from '@nestjs/common';
import { KlienService } from './klien.service';
import { KlienController } from './klien.controller';

@Module({
  controllers: [KlienController],
  providers: [KlienService],
  exports: [KlienService],
})
export class KlienModule {}
