// ============================================================================
// FILE: src/common/interfaces/entities/base.entity.ts
// ============================================================================

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Base entity for selection (minimal fields)
 */
export interface BaseSelection {
  id: string;
}
