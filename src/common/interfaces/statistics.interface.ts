// ===== FILE: src/common/interfaces/statistics.interface.ts (FIXED) =====

export interface TeamStatistics {
  total_users: number;
  by_role: Record<string, number>;
  active_users: number;
  inactive_users: number;
  recent_additions: number;
  last_30_days: number;
}

export interface WorkloadDistribution {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  active_perkara: number;
  pending_tugas: number;
  completed_tugas: number;
  total_dokumen: number;
  workload_score: number;
}

// ✅ FIXED: Tambahkan property 'row' untuk bulk import errors
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    user_id?: string;
    email: string;
    reason: string;
    row?: number;
  }>;
}
