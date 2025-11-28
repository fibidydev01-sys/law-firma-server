// ===== FILE: src/modules/logger/logger.module.ts =====
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import loggerConfig from '../../config/logger.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(loggerConfig)],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
