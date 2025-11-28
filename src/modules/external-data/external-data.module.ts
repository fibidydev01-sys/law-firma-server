import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ExternalDataService } from './external-data.service';
import { ExternalDataController } from './external-data.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [ExternalDataController],
  providers: [ExternalDataService],
  exports: [ExternalDataService],
})
export class ExternalDataModule { }