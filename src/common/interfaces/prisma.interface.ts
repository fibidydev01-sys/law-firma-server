// ============================================================================
// FILE: src/common/interfaces/prisma.interface.ts
// ============================================================================

/**
 * Prisma Middleware Parameters
 */
export interface PrismaMiddlewareParams {
  model?: string;
  action: PrismaAction;
  args: Record<string, unknown>;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Prisma Action Types
 */
export type PrismaAction =
  | 'findUnique'
  | 'findUniqueOrThrow'
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findMany'
  | 'create'
  | 'createMany'
  | 'update'
  | 'updateMany'
  | 'upsert'
  | 'delete'
  | 'deleteMany'
  | 'executeRaw'
  | 'queryRaw'
  | 'aggregate'
  | 'count'
  | 'runCommandRaw'
  | 'findRaw'
  | 'aggregateRaw';

/**
 * Prisma Middleware Function Type
 */
export type PrismaMiddleware = (
  params: PrismaMiddlewareParams,
  next: (params: PrismaMiddlewareParams) => Promise<unknown>,
) => Promise<unknown>;

/**
 * Prisma Query Event
 */
export interface PrismaQueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

/**
 * Prisma Error Event
 */
export interface PrismaErrorEvent {
  timestamp: Date;
  message: string;
  target: string;
}

/**
 * Prisma Log Event
 */
export interface PrismaLogEvent {
  timestamp: Date;
  message: string;
  target: string;
}
