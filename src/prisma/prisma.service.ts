// ===== FILE: src/prisma/prisma.service.ts (TYPE-SAFE VERSION) =====
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common'; // ✅ ADD INestApplication
import { PrismaClient } from '@prisma/client';
import { DatabaseMetrics } from '../modules/monitoring/metrics/database.metrics';
import {
  PrismaMiddlewareParams,
  PrismaMiddleware,
  PrismaQueryEvent,
  PrismaErrorEvent,
  PrismaLogEvent,
} from '../common/interfaces';

// 🔥 TYPE-SAFE: Interface untuk query result
interface PostgresTable {
  tablename: string;
}

// 🔥 TYPE-SAFE: Type for Prisma Client with middleware support
type ExtendedPrismaClient = PrismaClient & {
  $use?: (middleware: PrismaMiddleware) => void;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private dbMetrics?: DatabaseMetrics) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Setup metrics middleware if available
    if (this.dbMetrics) {
      this.setupMetricsMiddleware();
      this.setupQueryLogging();
    }
  }

  private setupMetricsMiddleware(): void {
    const prismaClient = this as unknown as ExtendedPrismaClient;

    if (typeof prismaClient.$use !== 'function') {
      console.warn(
        '⚠️  Prisma middleware ($use) not available. Skipping metrics middleware setup.',
      );
      console.warn('⚠️  Using event-based metrics instead.');

      this.setupEventBasedMetrics();
      return;
    }

    // 🔥 TYPE-SAFE: Middleware dengan proper typing
    const metricsMiddleware: PrismaMiddleware = async (
      params: PrismaMiddlewareParams,
      next: (params: PrismaMiddlewareParams) => Promise<unknown>,
    ): Promise<unknown> => {
      const startTime = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        this.dbMetrics?.recordQuery(
          params.action,
          params.model || 'unknown',
          duration,
        );

        if (duration > 1000) {
          console.warn(`🐌 Slow Query Detected:`, {
            model: params.model,
            action: params.action,
            duration: `${duration}ms`,
          });
        }

        return result;
      } catch (error) {
        const err = error as Error;
        const duration = Date.now() - startTime;

        this.dbMetrics?.recordError(err.constructor.name, params.action);

        console.error('❌ Database Error:', {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
          error: err.message,
        });

        throw error;
      }
    };

    prismaClient.$use(metricsMiddleware);
  }

  // 🔥 TYPE-SAFE: Event-based metrics (fallback)
  private setupEventBasedMetrics(): void {
    // Use Prisma's built-in $on (already typed)
    this.$on('query' as never, (event: unknown) => {
      const queryEvent = event as PrismaQueryEvent;

      // Record query metrics
      this.dbMetrics?.recordQuery('query', 'unknown', queryEvent.duration);

      // Log slow queries
      if (queryEvent.duration > 1000) {
        console.warn(`🐌 Slow Query Detected:`, {
          query: queryEvent.query,
          duration: `${queryEvent.duration}ms`,
          timestamp: queryEvent.timestamp,
        });
      }
    });
  }

  private setupQueryLogging(): void {
    // Log queries in development
    if (process.env.NODE_ENV !== 'production') {
      this.$on('query' as never, (event: unknown) => {
        const queryEvent = event as PrismaQueryEvent;
        console.log('Query: ' + queryEvent.query);
        console.log('Duration: ' + queryEvent.duration + 'ms');
      });
    }

    this.$on('error' as never, (event: unknown) => {
      const errorEvent = event as PrismaErrorEvent;
      console.error('Database Error:', {
        message: errorEvent.message,
        target: errorEvent.target,
        timestamp: errorEvent.timestamp,
      });
    });

    this.$on('warn' as never, (event: unknown) => {
      const warnEvent = event as PrismaLogEvent;
      console.warn('Database Warning:', {
        message: warnEvent.message,
        target: warnEvent.target,
        timestamp: warnEvent.timestamp,
      });
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    console.log('✅ Prisma connected to database');

    // Track connection pool stats
    setInterval(() => {
      this.dbMetrics?.setActiveConnections(1); // Placeholder
    }, 30000);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log('✅ Prisma disconnected from database');
  }

  /**
   * 🔥 TYPE-SAFE: Enable shutdown hooks for graceful shutdown
   */
  enableShutdownHooks(app: INestApplication): void {
    this.$on('beforeExit' as never, () => {
      void app.close();
    });
  }

  /**
   * 🔥 TYPE-SAFE: Clean database (for testing only)
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  cleanDatabase() is disabled in production');
      return;
    }

    const tables = await this.$queryRaw<PostgresTable[]>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
          );
        } catch (error) {
          const err = error as Error;
          console.log(`Error truncating ${tablename}:`, err.message);
        }
      }
    }
  }
}
