// ============================================================================
// FILE: src/common/interfaces/error.interface.ts
// ============================================================================

/**
 * HTTP Exception Response
 */
export interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Prisma Error Meta
 */
export interface PrismaErrorMeta {
  target?: string[];
  field_name?: string;
  model_name?: string;
  [key: string]: unknown;
}

/**
 * Application Error
 */
export interface ApplicationError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}
