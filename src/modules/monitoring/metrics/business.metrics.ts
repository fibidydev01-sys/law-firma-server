// ===== FILE: src/modules/monitoring/metrics/business.metrics.ts =====
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, register } from 'prom-client';

@Injectable()
export class BusinessMetrics {
  // Active Users
  private readonly activeUsersGauge: Gauge;

  // User Actions Counter
  private readonly userActionsCounter: Counter;

  // Entity Counters
  private readonly entityCounter: Counter;

  constructor() {
    this.activeUsersGauge = new Gauge({
      name: 'active_users_total',
      help: 'Current number of active users',
      registers: [register],
    });

    this.userActionsCounter = new Counter({
      name: 'user_actions_total',
      help: 'Total number of user actions',
      labelNames: ['action', 'entity_type'],
      registers: [register],
    });

    this.entityCounter = new Counter({
      name: 'entity_operations_total',
      help: 'Total number of entity operations',
      labelNames: ['entity', 'operation'],
      registers: [register],
    });
  }

  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  recordUserAction(action: string, entityType: string) {
    this.userActionsCounter.inc({ action, entity_type: entityType });
  }

  recordEntityOperation(entity: string, operation: string) {
    this.entityCounter.inc({ entity, operation });
  }
}
