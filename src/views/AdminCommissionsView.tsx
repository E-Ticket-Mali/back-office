import { useState } from 'react';
import { getOrganizers, updateCommissionRate } from '../api/organizers';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { StatusBadge } from '../components/ui';
import { cardStyle, inputStyle, mutedText, outlineButtonStyle, primaryButtonStyle } from '../components/uiStyles';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminOrganizer, OrganizerStatus } from '../types';
import { GOLD, GREEN } from '../theme';

/** Doit rester aligné sur BookingService.DEFAULT_COMMISSION_RATE côté backend. */
const DEFAULT_RATE = 10;

const STATUS_LABEL: Record<OrganizerStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
};

const ROW_GRID = 'minmax(160px,1fr) 120px 130px minmax(260px,1.2fr)';

type CommissionRowProps = Readonly<{
  organizer: AdminOrganizer;
  onSave: (rate: number | null) => Promise<void>;
}>;

function CommissionRow({ organizer, onSave }: CommissionRowProps) {
  const [value, setValue] = useState(organizer.commissionRate != null ? String(organizer.commissionRate) : '');
  const [busy, setBusy] = useState(false);
  const isCustom = organizer.commissionRate != null;
  const dirty = value.trim() !== (isCustom ? String(organizer.commissionRate) : '');

  const save = async (rate: number | null) => {
    setBusy(true);
    try {
      await onSave(rate);
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed === '') return save(null);
    const rate = Number(trimmed.replace(',', '.'));
    return save(Number.isFinite(rate) ? rate : Number.NaN);
  };

  return (
    <div
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
        <strong>{organizer.name}</strong>
        <div style={{ ...mutedText, fontSize: 11.5 }}>{organizer.email}</div>
      </div>
      <span>{STATUS_LABEL[organizer.status]}</span>
      {isCustom ? (
        <StatusBadge label={`${organizer.commissionRate} % (spécifique)`} color={GOLD} bg="rgba(166,116,29,0.12)" />
      ) : (
        <StatusBadge label={`${DEFAULT_RATE} % (défaut)`} color={GREEN} bg="rgba(22,74,35,0.1)" />
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          placeholder={`${DEFAULT_RATE} (défaut)`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, width: 110 }}
          aria-label={`Taux de commission de ${organizer.name}`}
        />
        <button type="button" disabled={busy || !dirty} onClick={submit} style={{ ...primaryButtonStyle, opacity: busy || !dirty ? 0.5 : 1 }}>
          Enregistrer
        </button>
        {isCustom && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setValue('');
              return save(null);
            }}
            style={outlineButtonStyle}
          >
            Taux par défaut
          </button>
        )}
      </div>
    </div>
  );
}

/** ADMIN › Finances › Commissions : taux par organisateur (vide = taux plateforme). */
export function AdminCommissionsView({ filters }: Readonly<{ filters: TableFilters }>) {
  const { data: organizers, setData, loading, refreshing, error } = useCollection(() => getOrganizers());
  const { run, banner } = useActionError();

  if (loading) return <LoadingState label="Chargement des commissions…" />;
  if (error) return <ErrorState message={error} />;

  const q = filters.search.trim().toLocaleLowerCase('fr-FR');
  const visible = organizers.filter((o) => !q || `${o.name} ${o.email}`.toLocaleLowerCase('fr-FR').includes(q));
  const customCount = organizers.filter((o) => o.commissionRate != null).length;

  const save = (organizer: AdminOrganizer, rate: number | null) =>
    run(async () => {
      if (rate != null && (Number.isNaN(rate) || rate < 0 || rate > 100)) {
        throw new Error('Le taux de commission doit être compris entre 0 et 100.');
      }
      const updated = await updateCommissionRate(organizer.id, rate);
      setData((rows) => rows.map((o) => (o.id === updated.id ? updated : o)));
    });

  return (
    <div className="bo-page">
      {refreshing && <InlineRefreshHint />}
      <div className="bo-card" style={{ ...cardStyle, marginBottom: 16, fontSize: 13 }}>
        Taux plateforme par défaut : <strong>{DEFAULT_RATE} %</strong> · {customCount} organisateur(s) avec un taux spécifique.
        <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
          Le taux s'applique aux nouvelles ventes ; les réservations déjà confirmées gardent la commission calculée à l'achat.
        </div>
      </div>
      {banner}
      <div className="bo-card" style={cardStyle}>
        {visible.length === 0 && <div style={mutedText}>Aucun organisateur.</div>}
        {visible.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 10, padding: '0 12px 6px', ...mutedText, fontSize: 11.5, fontWeight: 700 }}>
            <span>ORGANISATEUR</span>
            <span>STATUT</span>
            <span>TAUX ACTUEL</span>
            <span>MODIFIER</span>
          </div>
        )}
        <div style={{ display: 'grid', gap: 6 }}>
          {visible.map((o) => (
            <CommissionRow key={`${o.id}:${o.commissionRate ?? ''}`} organizer={o} onSave={(rate) => save(o, rate)} />
          ))}
        </div>
      </div>
    </div>
  );
}
