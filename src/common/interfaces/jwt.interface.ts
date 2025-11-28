// ============================================================================
// FILE: src/common/interfaces/jwt.interface.ts (FIXED VERSION)
// ============================================================================
import { UserRole } from '@prisma/client';

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * User Payload (for Request)
 */
export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  nama_lengkap: string;
}

/**
 * Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Auth Response
 * UPDATED: nama_lengkap bisa string atau null dari database
 */
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    nama_lengkap: string; // Sudah di-handle di service level (|| '')
    role: UserRole;
    jabatan?: string | null;
    avatar_url?: string | null;
  };
}
