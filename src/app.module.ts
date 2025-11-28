// ===== FILE: src/app.module.ts (MERGED & COMPLETE) =====
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// ============================================================================
// Configuration Imports
// ============================================================================
import { PrismaModule } from './prisma/prisma.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import loggerConfig from './config/logger.config';
import monitoringConfig from './config/monitoring.config';
import appConfig from './config/app.config';

// ============================================================================
// Infrastructure Modules
// ============================================================================
import { RedisCacheModule } from './modules/cache/redis-cache.module';
import { StorageModule } from './modules/storage/storage.module';
import { EmailModule } from './modules/email/email.module';

// ============================================================================
// Observability Modules
// ============================================================================
import { LoggerModule } from './modules/logger/logger.module';
import { LoggerMiddleware } from './modules/logger/logger.middleware';
import { LoggingInterceptor } from './modules/logger/logger.interceptor';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MetricsInterceptor } from './modules/monitoring/metrics.interceptor';
import { HealthModule } from './modules/health/health.module';

// ============================================================================
// Core Controllers & Services
// ============================================================================
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ============================================================================
// Guards
// ============================================================================
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// ============================================================================
// Filters
// ============================================================================
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

// ============================================================================
// Interceptors
// ============================================================================
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// ============================================================================
// Feature Modules
// ============================================================================
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KlienModule } from './modules/klien/klien.module';
import { PerkaraModule } from './modules/perkara/perkara.module';
import { TugasModule } from './modules/tugas/tugas.module';
import { DokumenModule } from './modules/dokumen/dokumen.module';
import { FolderModule } from './modules/folder/folder.module';
import { SidangModule } from './modules/sidang/sidang.module';
import { CatatanModule } from './modules/catatan/catatan.module';
import { TimPerkaraModule } from './modules/tim-perkara/tim-perkara.module';
import { KonflikModule } from './modules/konflik/konflik.module';
import { LogAktivitasModule } from './modules/log-aktivitas/log-aktivitas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExternalDataModule } from './modules/external-data/external-data.module';

@Module({
  imports: [
    // ============================================================================
    // Config Module - Load all configurations
    // ============================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        loggerConfig,
        monitoringConfig,
      ],
    }),

    // ============================================================================
    // Observability Stack
    // ============================================================================
    LoggerModule,
    MonitoringModule,
    HealthModule,

    // ============================================================================
    // Infrastructure (Global Modules)
    // ============================================================================
    RedisCacheModule,
    PrismaModule,
    StorageModule,
    EmailModule,

    // ============================================================================
    // Feature Modules
    // ============================================================================
    AuthModule,
    UsersModule,
    KlienModule,
    PerkaraModule,
    TugasModule,
    DokumenModule, // ✅ SINGLE SYSTEM: handles both staff & client uploads
    FolderModule, // ✅ Virtual folder organization
    SidangModule,
    CatatanModule,
    TimPerkaraModule,
    KonflikModule,
    LogAktivitasModule,
    DashboardModule,
    ExternalDataModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,

    // ============================================================================
    // Global Guards (Applied in order)
    // ============================================================================
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // ============================================================================
    // Global Filters (Error Handling)
    // ============================================================================
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },

    // ============================================================================
    // Global Interceptors (Applied in order)
    // ============================================================================
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logger middleware to all routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
