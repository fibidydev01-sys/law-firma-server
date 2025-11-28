// ===== FILE: src/modules/users/users.module.ts (REFACTORED) =====
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersManagementController } from './controllers/users-management.controller';
import { UsersBulkController } from './controllers/users-bulk.controller';
import { UsersImportExportController } from './controllers/users-import-export.controller';
import { UserManagementService } from './services/user-management.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserBulkOperationsService } from './services/user-bulk-operations.service';
import { UserImportExportService } from './services/user-import-export.service';
import { LogAktivitasModule } from '../log-aktivitas/log-aktivitas.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [
    LogAktivitasModule, // ✅ Import untuk inject LogAktivitasService
    GoogleDriveModule, // ✅ Import untuk inject GoogleDriveService
  ],
  controllers: [
    UsersController,
    UsersManagementController,
    UsersBulkController,
    UsersImportExportController,
  ],
  providers: [
    UsersService,
    UserManagementService,
    UserStatisticsService,
    UserBulkOperationsService,
    UserImportExportService,
  ],
  exports: [UsersService], // ✅ Export untuk digunakan module lain
})
export class UsersModule {}
