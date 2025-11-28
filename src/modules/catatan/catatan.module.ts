// ===== FILE: src/modules/catatan/catatan.module.ts =====
import { Module } from '@nestjs/common';
import { CatatanService } from './catatan.service';
import { CatatanController } from './catatan.controller';

@Module({
  controllers: [CatatanController],
  providers: [CatatanService],
  exports: [CatatanService],
})
export class CatatanModule {}
