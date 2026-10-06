import { useState } from 'react';
import { approvePayoutRequest, getAdminPayoutRequests, markPayoutPaid, rejectPayoutRequest } from '../api/payouts';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge, Tabs, type TabDef } from '../components/ui';
import { cardStyle, dangerButtonStyle, formatDateTime, formatFcfa, mutedText, primaryButtonStyle } from '../components/uiStyles';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminPayoutRequest, PayoutStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  PAID: 'Payée',
};

const STATUS_COLOR: Record<PayoutStatus, [string, string]> = {
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: [GOLD, 'rgba(166,116,29,0.12)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
  PAID: [GREEN, 'rgba(22,74,35,0.1)'],
};

type Filter = 'ALL' | PayoutStatus;

const ROW_GRID = 'minmax(150px,1fr) 130px 110px 150px minmax(200px,auto)';

/** ADMIN › Finances › Demandes de reversement : approbation → paiement, ou refus motivé. */
export function AdminPayoutsView({ filters }: Readonly<{ filters: TableFilters }>) {
  const { data: payouts, setData, loading, refreshing, error } = useCollection(() => getAdminPayoutRequests());
  const { run, banner } = useActionError();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [rejecting, setRejecting] = useState<AdminPayoutRequest | null>(null);

  if (loading) return <LoadingState label="Chargement des demandes de reversement…" />;
  if (error) return <ErrorState message={error} />;

  const replace = (updated: AdminPayoutRequest) => setData((rows) => rows.map((p) => (p.id === updated.id ? updated : p)));
  const count = (s: PayoutStatus) => payouts.filter((p) => p.status === s).length;
  const sum = (s: PayoutStatus) => payouts.filter((p) => p.status === s).reduce((acc, p) => acc + p.amount, 0);

  const tabs: TabDef<Filter>[] = [
    { id: 'PENDING', label: 'À traiter', count: count('PENDING') },
    { id: 'APPROVED', label: 'À payer', count: count('APPROVED') },
    { id: 'PAID', label: 'Payées', count: count('PAID') },
    { id: 'REJECTED', label: 'Refusées', count: count('REJECTED') },
    { id: 'ALL', label: 'Toutes', count: payouts.length },
  ];

  const q = filters.search.trim().toLocaleLowerCase('fr-FR');
  const visible = payouts
    .filter((p) => filter === 'ALL' || p.status === filter)
    .filter((p) => !q || p.organizerName.toLocaleLowerCase('fr-FR').includes(q))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  return (
    <div className="bo-page">
      {refreshing && <InlineRefreshHint />}
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
        <KpiCard label="En attente de décision" value={formatFcfa(sum('PENDING'))} sub={`${count('PENDING')} demande(s)`} color={GOLD} />
        <KpiCard label="Approuvées, à payer" value={formatFcfa(sum('APPROVED'))} sub={`${count('APPROVED')} demande(s)`} color={GOLD} />
        <KpiCard label="Déjà reversé" value={formatFcfa(sum('PAID'))} sub={`${count('PAID')} paiement(s)`} color={GREEN} />
      </div>

      <Tabs tabs={tabs} active={filter} onChange={setFilter} />
      {banner}

      <div className="bo-card" style={cardStyle}>
        {visible.length === 0 && <div style={mutedText}>Aucune demande dans cette catégorie.</div>}
        {visible.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 10, padding: '0 12px 6px', ...mutedText, fontSize: 11.5, fontWeight: 700 }}>
            <span>ORGANISATEUR</span>
            <span>MONTANT</span>
            <span>STATUT</span>
            <span>DEMANDÉE LE</span>
            <span>ACTIONS</span>
          </div>
        )}
        <div style={{ display: 'grid', gap: 6 }}>
          {visible.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: ROW_GRID,
                gap: 10,
                alignItems: 'center',
                padding: '9px 12px',
                background: '#FAF3EB',
                borderRadius: 7,
                fontSize: 12.5,
              }}
            >
              <div>
                <strong>{p.organizerName}</strong>
                {p.adminNote && <div style={{ ...mutedText, fontSize: 11.5 }}>Note : {p.adminNote}</div>}
              </div>
              <strong>{formatFcfa(p.amount)}</strong>
              <StatusBadge label={STATUS_LABEL[p.status]} color={STATUS_COLOR[p.status][0]} bg={STATUS_COLOR[p.status][1]} />
              <span style={mutedText}>{formatDateTime(p.requestedAt)}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.status === 'PENDING' && (
                  <>
                    <button type="button" style={primaryButtonStyle} onClick={() => run(async () => replace(await approvePayoutRequest(p.id)))}>
                      Approuver
                    </button>
                    <button type="button" style={dangerButtonStyle} onClick={() => setRejecting(p)}>
                      Refuser
                    </button>
                  </>
                )}
                {p.status === 'APPROVED' && (
                  <button type="button" style={primaryButtonStyle} onClick={() => run(async () => replace(await markPayoutPaid(p.id)))}>
                    Marquer comme payée
                  </button>
                )}
                {(p.status === 'PAID' || p.status === 'REJECTED') && (
                  <span style={{ ...mutedText, fontSize: 12 }}>Traitée le {formatDateTime(p.decidedAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {rejecting && (
        <ConfirmDialog
          title="Refuser la demande de reversement"
          message={`${rejecting.organizerName} — ${formatFcfa(rejecting.amount)}. Le montant redeviendra disponible dans le solde de l'organisateur.`}
          reasonLabel="Motif du refus"
          reasonPlaceholder="Expliquez à l'organisateur pourquoi la demande est refusée…"
          confirmLabel="Refuser"
          onCancel={() => setRejecting(null)}
          onConfirm={async (reason) => {
            replace(await rejectPayoutRequest(rejecting.id, reason));
            setRejecting(null);
          }}
        />
      )}
    </div>
  );
}
