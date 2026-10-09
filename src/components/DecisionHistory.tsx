import { getEntityDecisions, type AuditAction, type AuditEntityType } from '../api/audit';
import { useCollection } from '../hooks/useCollection';

const ACTION_LABEL: Record<AuditAction, string> = {
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
  REACTIVATED: 'Réactivé',
  COMMISSION_CHANGED: 'Taux de commission modifié',
  PAID: 'Marqué comme payé',
  DELETED: 'Supprimé',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  APPROVED: '#164A23',
  REACTIVATED: '#164A23',
  PAID: '#164A23',
  REJECTED: '#CE1126',
  SUSPENDED: '#A6741D',
  DELETED: '#CE1126',
  COMMISSION_CHANGED: '#1F2E35',
};

type DecisionHistoryProps = Readonly<{
  entityType: AuditEntityType;
  entityId: string;
  /** Titre affiché au-dessus de la liste ; absent = liste seule (ex. dépliée dans une ligne). */
  title?: string;
}>;

/** Historique des décisions de l'administration sur une entité : auteur, date, motif. Pour le
 * rafraîchir après une action, changer la `key` du composant. */
export function DecisionHistory({ entityType, entityId, title }: DecisionHistoryProps) {
  const { data: entries, loading, error } = useCollection(() => getEntityDecisions(entityType, entityId));

  return (
    <div data-testid="decision-history">
      {title && (
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      )}
      {loading && <div style={{ fontSize: 12.5, color: '#6B6459' }}>Chargement de l'historique…</div>}
      {error && <div style={{ fontSize: 12.5, color: '#CE1126' }}>{error}</div>}
      {!loading && !error && entries.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#6B6459' }}>Aucune décision enregistrée.</div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ padding: '9px 12px', background: '#FAF3EB', borderRadius: 7, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong style={{ color: ACTION_COLOR[entry.action] }}>{ACTION_LABEL[entry.action]}</strong>
              <span style={{ color: '#6B6459' }}>
                par {entry.actorName} · {new Date(entry.createdAt).toLocaleString('fr-FR')}
              </span>
            </div>
            {entry.detail && <div style={{ color: '#4F5048', marginTop: 3 }}>{entry.detail}</div>}
            {entry.reason && <div style={{ color: '#4F5048', marginTop: 3 }}>Motif : {entry.reason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
