// ===== FILE: src/modules/konflik/konflik.module.ts =====
import { Module } from '@nestjs/common';
import { KonflikService } from './konflik.service';
import { KonflikController } from './konflik.controller';

@Module({
  controllers: [KonflikController],
  providers: [KonflikService],
  exports: [KonflikService],
})
export class KonflikModule {}
