import { http } from './http';

export type AuditEntityType = 'ORGANIZER' | 'EVENT' | 'PAYOUT';
export type AuditAction = 'CREATED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'REACTIVATED' | 'COMMISSION_CHANGED' | 'PAID' | 'DELETED';

/** Une décision de l'administration : qui, quoi, quand, pourquoi. */
export interface DecisionAuditEntry {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  reason?: string | null;
  detail?: string | null;
  actorName: string;
  createdAt: string;
}

export const getEntityDecisions = (entityType: AuditEntityType, entityId: string) =>
  http.get<DecisionAuditEntry[]>(`/admin/audit?entityType=${entityType}&entityId=${entityId}`);
