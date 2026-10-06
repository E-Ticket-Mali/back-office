import { useState } from 'react';
import { createPayoutRequest, getBalance, getPayoutRequests } from '../api/organizerFinance';
import { getOrganizerProfile } from '../api/organizerProfile';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/ui';
import { cardStyle, formatDateTime, formatFcfa, inputStyle, mutedText, primaryButtonStyle } from '../components/uiStyles';
import { GOLD, GREEN } from '../theme';
import type { Balance, PayoutRequest, PayoutStatus } from '../types';

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

const titleStyle: React.CSSProperties = { fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, margin: '0 0 12px' };

function BalanceKpis({ balance }: Readonly<{ balance: Balance }>) {
  return (
    <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
      <KpiCard label="Revenu net" value={formatFcfa(balance.netRevenue)} sub="ventes − commission" color={GREEN} />
      <KpiCard label="Engagé en reversements" value={formatFcfa(balance.committed)} sub="en attente, approuvé ou payé" color={GOLD} />
      <KpiCard label="Solde disponible" value={formatFcfa(balance.available)} sub="demandable" color={GREEN} />
    </div>
  );
}

function PayoutList({ payouts, detailed }: Readonly<{ payouts: PayoutRequest[]; detailed: boolean }>) {
  if (payouts.length === 0) return <div style={mutedText}>Aucune demande de reversement.</div>;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {payouts.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'grid',
            gridTemplateColumns: detailed ? '130px 110px 1fr 1fr' : '1fr auto',
            gap: 12,
            alignItems: 'center',
            padding: '10px 12px',
            background: '#FAF3EB',
            borderRadius: 7,
            fontSize: 13,
          }}
        >
          <strong>{formatFcfa(p.amount)}</strong>
          <StatusBadge label={STATUS_LABEL[p.status]} color={STATUS_COLOR[p.status][0]} bg={STATUS_COLOR[p.status][1]} />
          {detailed && (
            <>
              <span style={{ ...mutedText, fontSize: 12 }}>
                Demandée le {formatDateTime(p.requestedAt)}
                {p.decidedAt && <> · traitée le {formatDateTime(p.decidedAt)}</>}
              </span>
              <span style={{ ...mutedText, fontSize: 12 }}>{p.adminNote ? `Note : ${p.adminNote}` : ''}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PayoutRequestForm({ available, onCreated }: Readonly<{ available: number; onCreated: () => void }>) {
  const [amount, setAmount] = useState('');
  const { run, banner } = useActionError();
  const submit = () =>
    run(async () => {
      const value = Number(amount);
      if (amount.trim() === '' || !(value > 0)) throw new Error('Renseignez un montant supérieur à 0.');
      if (value > available) throw new Error('Le montant demandé dépasse le solde disponible.');
      await createPayoutRequest(value);
      setAmount('');
      onCreated();
    });
  return (
    <div className="bo-card" style={{ ...cardStyle, marginBottom: 18 }}>
      <h2 style={titleStyle}>Nouvelle demande de reversement</h2>
      {banner}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="number"
          min={0}
          placeholder="Montant en FCFA"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />
        <button type="button" onClick={submit} style={{ ...primaryButtonStyle, padding: '9px 16px' }}>
          Demander
        </button>
        <button type="button" onClick={() => setAmount(String(available))} style={{ ...primaryButtonStyle, background: 'transparent', color: '#164A23', border: '1px solid #164A23', padding: '9px 16px' }}>
          Tout le solde ({formatFcfa(available)})
        </button>
      </div>
    </div>
  );
}

/** ORGANIZER › Finances : null = Vue financière · 'balance' · 'requests' · 'history'. */
export function OrganizerFinanceView({ section = null }: Readonly<{ section?: string | null }>) {
  const { data: balanceRows, loading: balanceLoading, error: balanceError, reload: reloadBalance } = useCollection(() =>
    getBalance().then((b) => [b]),
  );
  const { data: payouts, loading: payoutsLoading, error: payoutsError, reload: reloadPayouts } = useCollection(getPayoutRequests);
  const { data: profileRows } = useCollection(() => getOrganizerProfile().then((p) => [p]));

  if (balanceLoading || payoutsLoading) return <LoadingState label="Chargement des finances…" />;
  if (balanceError) return <ErrorState message={balanceError} />;
  if (payoutsError) return <ErrorState message={payoutsError} />;
  const balance = balanceRows[0];
  if (!balance) return <ErrorState message="Données financières indisponibles." />;

  const sorted = [...payouts].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const open = sorted.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED');
  const rate = profileRows[0]?.commissionRate;
  const afterCreate = () => {
    reloadBalance();
    reloadPayouts();
  };

  if (section === 'balance') {
    return (
      <div className="bo-page">
        <BalanceKpis balance={balance} />
        <div className="bo-card" style={{ ...cardStyle, fontSize: 13, lineHeight: 1.7 }}>
          <h2 style={titleStyle}>Calcul du solde</h2>
          <div>Revenu net (billets confirmés − commission plateforme) : <strong>{formatFcfa(balance.netRevenue)}</strong></div>
          <div>− Reversements engagés (en attente, approuvés ou payés) : <strong>{formatFcfa(balance.committed)}</strong></div>
          <div>= Solde disponible : <strong style={{ color: '#164A23' }}>{formatFcfa(balance.available)}</strong></div>
          <div style={{ ...mutedText, fontSize: 12, marginTop: 8 }}>
            Taux de commission appliqué : {rate != null ? `${rate} %` : 'taux par défaut de la plateforme (10 %)'}. Une demande refusée libère à nouveau son montant.
          </div>
        </div>
      </div>
    );
  }

  if (section === 'requests') {
    return (
      <div className="bo-page">
        <PayoutRequestForm available={balance.available} onCreated={afterCreate} />
        <div className="bo-card" style={cardStyle}>
          <h2 style={titleStyle}>Demandes en cours ({open.length})</h2>
          <PayoutList payouts={open} detailed />
        </div>
      </div>
    );
  }

  if (section === 'history') {
    return (
      <div className="bo-page">
        <div className="bo-card" style={cardStyle}>
          <h2 style={titleStyle}>Historique des reversements ({sorted.length})</h2>
          <PayoutList payouts={sorted} detailed />
        </div>
      </div>
    );
  }

  const paidTotal = payouts.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);
  return (
    <div className="bo-page">
      <BalanceKpis balance={balance} />
      <div className="bo-card" style={{ ...cardStyle, marginBottom: 18, fontSize: 13 }}>
        Déjà reversé : <strong>{formatFcfa(paidTotal)}</strong> · {open.length} demande(s) en cours · commission{' '}
        {rate != null ? `${rate} %` : 'par défaut (10 %)'}
      </div>
      <div className="bo-card" style={cardStyle}>
        <h2 style={titleStyle}>Dernières demandes</h2>
        <PayoutList payouts={sorted.slice(0, 5)} detailed={false} />
      </div>
    </div>
  );
}
