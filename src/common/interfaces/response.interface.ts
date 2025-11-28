// ============================================================================
// FILE: src/common/interfaces/response.interface.ts
// ============================================================================

import { PaginationMeta } from './pagination.interface';

/**
 * Standard API Success Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  message: string;
  error?: string;
  errors?: ValidationError[];
}

/**
 * Validation Error Detail
 */
export interface ValidationError {
  property: string;
  constraints: Record<string, string>;
}
