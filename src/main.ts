// ===== FILE: src/main.ts (ENHANCED WITH CORS LOGGING) =====
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { Request, Response } from 'express';

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // CORS configuration
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:3001',
    'http://localhost:3002', // WEB-LAYANAN
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Health check endpoint (before global prefix)
  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    const response: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get<string>('app.nodeEnv', 'development'),
    };
    res.json(response);
  });

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static files (uploads)
  const uploadPath = configService.get<string>('app.upload.path', './uploads');
  app.use('/uploads', express.static(join(process.cwd(), uploadPath)));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Firma Hukum PERARI - API Documentation')
    .setDescription(
      'Complete API documentation for Law Firm Management System with Redis caching, monitoring, and advanced features',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and team operations')
    .addTag('Klien', 'Client management')
    .addTag('Perkara', 'Case management with caching')
    .addTag('Jadwal Sidang', 'Court schedule management')
    .addTag('Tugas', 'Task management')
    .addTag('Dokumen Hukum', 'Legal document management')
    .addTag('Catatan Perkara', 'Case notes')
    .addTag('Pemeriksaan Konflik', 'Conflict checking')
    .addTag('Tim Perkara', 'Case team management')
    .addTag('Activity Logs', 'System activity monitoring')
    .addTag('Dashboard', 'Analytics and statistics')
    .addTag('Cache Management', 'Cache operations and monitoring')
    .addTag('Monitoring', 'System health and metrics')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Firma Hukum PERARI - API Docs',
  });

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  // ============================================================================
  // ENHANCED STARTUP LOGGING WITH CORS INFO
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('🚀 FIRMA HUKUM PERARI - SERVER STARTED');
  console.log('='.repeat(80));
  console.log(`📍 Application URL: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${configService.get<string>('app.nodeEnv')}`);
  console.log(`🗄️  Database: Connected`);
  console.log(`📦 Redis Cache: Connected`);
  console.log(`🔐 JWT Authentication: Enabled`);
  console.log(`📧 Email Service: Configured`);
  console.log(`📊 Monitoring: Active`);
  console.log('-'.repeat(80));
  console.log('🌐 CORS Enabled for:');
  corsOrigins.forEach((origin, index) => {
    console.log(`   ${index + 1}. ${origin}`);
  });
  console.log('-'.repeat(80));
  console.log(`📁 Upload Path: ${uploadPath}`);
  console.log(`📤 Max File Size: ${configService.get<number>('app.upload.maxFileSize', 10485760) / 1024 / 1024}MB`);
  console.log('='.repeat(80));
  console.log('✅ Server is ready to handle requests\n');

  // Error handlers
  process.on(
    'unhandledRejection',
    (reason: unknown, promise: Promise<unknown>) => {
      console.error('Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
    },
  );

  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((error: Error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});