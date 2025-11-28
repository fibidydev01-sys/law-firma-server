// ============================================================================
// FILE: src/common/interfaces/request.interface.ts
// ============================================================================
import { Request } from 'express';
import { UserPayload } from './jwt.interface';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

/**
 * Request with optional user (for public routes)
 */
export interface OptionalAuthRequest extends Request {
  user?: UserPayload;
}

/**
 * Request with file upload
 */
export interface FileUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}
