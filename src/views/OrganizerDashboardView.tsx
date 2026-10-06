import { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { getOrganizerDashboard } from '../api/organizerDashboard';
import { getPayoutRequests, createPayoutRequest } from '../api/organizerFinance';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { GREEN, GOLD } from '../theme';
import { HeadlineBar } from '../components/ui';
import { plural } from '../components/uiStyles';
import type { OrganizerEventStatus, PayoutStatus, ViewId, ViewSection } from '../types';

const STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillons',
  PENDING_APPROVAL: 'En attente de validation',
  PUBLISHED: 'Publiés',
  REJECTED: 'Rejetés',
};

const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  PAID: 'Payée',
};

const PAYOUT_STATUS_COLORS: Record<PayoutStatus, [string, string]> = {
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: ['#0F9430', 'rgba(20,181,58,0.12)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
  PAID: ['#0F9430', 'rgba(20,181,58,0.12)'],
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 10,
  padding: 20,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  flex: 1,
};

type OrganizerDashboardViewProps = Readonly<{ onNavigate: (view: ViewId, section?: ViewSection) => void }>;

export function OrganizerDashboardView({ onNavigate }: OrganizerDashboardViewProps) {
  const { data: dashRows, loading: dashLoading, error: dashError } = useCollection(() =>
    getOrganizerDashboard().then((d) => [d])
  );
  const { data: payouts, loading: payoutsLoading, error: payoutsError, reload: reloadPayouts } = useCollection(getPayoutRequests);
  const [amount, setAmount] = useState('');
  const { run, banner } = useActionError();

  if (dashLoading || payoutsLoading) return <LoadingState label="Chargement du tableau de bord…" />;
  if (dashError) return <ErrorState message={dashError} />;
  if (payoutsError) return <ErrorState message={payoutsError} />;

  const dash = dashRows[0];
  if (!dash) return <ErrorState message="Statistiques indisponibles." />;

  const statuses: OrganizerEventStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'];

  const kpis = [
    ...statuses.map((s) => ({
      label: STATUS_LABEL[s],
      value: dash.eventsByStatus[s] ?? 0,
      sub: 'événement(s)',
      color: s === 'PUBLISHED' ? GREEN : GOLD,
    })),
    { label: 'Billets vendus', value: dash.ticketsSold, sub: 'au total', color: GREEN },
    {
      label: 'Solde disponible',
      value: `${dash.balance.available.toLocaleString('fr-FR')} FCFA`,
      sub: 'après engagements',
      color: GREEN,
    },
    {
      label: 'Revenu net',
      value: `${dash.balance.netRevenue.toLocaleString('fr-FR')} FCFA`,
      sub: 'ventes confirmées moins commission',
      color: GREEN,
    },
  ];

  const requestPayout = () =>
    run(async () => {
      const value = Number(amount);
      if (amount.trim() === '' || !(value > 0)) throw new Error('Renseignez un montant supérieur à 0.');
      if (value > dash.balance.available) throw new Error('Le montant demandé dépasse le solde disponible.');
      await createPayoutRequest(value);
      setAmount('');
      reloadPayouts();
    });

  const published = dash.eventsByStatus.PUBLISHED ?? 0;
  const pendingReview = dash.eventsByStatus.PENDING_APPROVAL ?? 0;
  const rejected = dash.eventsByStatus.REJECTED ?? 0;

  return (
    <div className="bo-page">
      <HeadlineBar
        items={[
          { label: `${plural(published, 'événement')} ${published > 1 ? 'publiés' : 'publié'}`, onClick: () => onNavigate('organizerEvents', 'PUBLISHED') },
          { label: `${plural(dash.ticketsSold, 'billet')} ${dash.ticketsSold > 1 ? 'vendus' : 'vendu'}`, onClick: () => onNavigate('organizerTicketing', 'sales') },
          { label: `${dash.balance.available.toLocaleString('fr-FR')} FCFA disponibles`, onClick: () => onNavigate('organizerFinance', 'balance') },
          ...(pendingReview > 0
            ? [{ label: `${pendingReview} en attente de validation`, onClick: () => onNavigate('organizerEvents', 'PENDING_APPROVAL') }]
            : []),
          ...(rejected > 0
            ? [{ label: `${plural(rejected, 'événement')} ${rejected > 1 ? 'rejetés' : 'rejeté'}`, onClick: () => onNavigate('organizerEvents', 'REJECTED'), highlight: true }]
            : []),
        ]}
      />
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 22 }}>
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} />
        ))}
      </div>

      {banner}

      <div className="bo-card" style={{ ...cardStyle, marginBottom: 18 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          Demander un reversement
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="number"
            min={0}
            placeholder="Montant en FCFA"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={requestPayout}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#164A23',
              color: '#FAF3EB',
              borderRadius: 8,
              fontFamily: "'Poppins',sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Demander
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#6B6459', marginTop: 10 }}>
          Solde disponible : {dash.balance.available.toLocaleString('fr-FR')} FCFA
        </div>
      </div>

      <div className="bo-card" style={cardStyle}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          Demandes de reversement
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payouts.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucune demande pour le moment.</div>}
          {payouts.map((p) => {
            const [color, bg] = PAYOUT_STATUS_COLORS[p.status];
            return (
              <div key={p.id} style={rowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>
                    {p.amount.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: '#6B6459' }}>
                    Demandée le {new Date(p.requestedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    {p.adminNote && ` · ${p.adminNote}`}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    color,
                    background: bg,
                  }}
                >
                  {PAYOUT_STATUS_LABEL[p.status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
