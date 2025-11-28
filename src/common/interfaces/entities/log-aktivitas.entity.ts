// ============================================================================
// FILE: src/common/interfaces/entities/log-aktivitas.entity.ts
// ✅ SOLUSI FINAL YANG BENAR
// ============================================================================

import { Prisma } from '@prisma/client';
import { UserBasic } from './user.entity';

/**
 * Log Aktivitas Detail
 */
export type LogAktivitasDetail = Prisma.InputJsonValue;

/**
 * Log Aktivitas Entity - Complete data
 */
export interface LogAktivitasEntity {
  id: string;
  user_id: string | null;
  aksi: string;
  jenis_entitas: string | null;
  id_entitas: string | null;
  detail: Prisma.InputJsonValue | null;
  created_at: Date;
}

/**
 * Log Aktivitas with User
 */
export interface LogAktivitasWithUser extends LogAktivitasEntity {
  user: UserBasic | null;
}

/**
 * Create Log Aktivitas Data
 * Prisma sudah handle null secara otomatis dengan '?'
 */
export interface CreateLogAktivitasData {
  user_id: string;
  aksi: string;
  jenis_entitas?: string | null;
  id_entitas?: string | null;
  detail?: Prisma.InputJsonValue;
}
