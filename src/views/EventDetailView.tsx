import { useState } from 'react';
import {
  addTicketType,
  approveEvent,
  clearEventImage,
  clearTicketTypeImage,
  deleteTicketType,
  getEvent,
  getEventScanRecords,
  getEventStats,
  getEventTickets,
  rejectEvent,
  setEventImagePreset,
  setTicketTypeImagePreset,
  updateTicketType,
  uploadEventImage,
  uploadTicketTypeImage,
} from '../api/events';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { FreePill, TicketTypePill } from '../components/Pill';
import { LoadingState } from '../components/LoadingState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImagePicker } from '../components/ImagePicker';
import type { EventItem, EventTicket, OrganizerEventStatus, TicketType } from '../types';
import { Icon } from '../components/Icon';
import { CategoryIcon } from '../components/Icon';
import { GOLD, GREEN } from '../theme';

interface EventDetailViewProps {
  event: EventItem;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const selectStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1.5px solid #E7DED0',
  borderRadius: 7,
  fontSize: 12,
  background: '#FFFFFF',
  color: '#1F2E35',
};

const smallBtn = (color: string): React.CSSProperties => ({
  padding: '6px 10px',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
});

const bigBtn = (color: string, textColor = '#FAF3EB'): React.CSSProperties => ({
  padding: '10px 18px',
  border: 'none',
  background: color,
  color: textColor,
  borderRadius: 8,
  fontFamily: "'Poppins',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

const TICKET_TYPES: TicketType[] = ['VIP', 'STANDARD', 'EARLY_BIRD'];
const TICKET_LABELS: Record<TicketType, string> = { VIP: 'Billet VIP', STANDARD: 'Billet Standard', EARLY_BIRD: 'Billet Early Bird' };

const STATUS_COLOR: Record<string, [string, string]> = {
  VALID: ['#0F9430', 'rgba(20,181,58,0.12)'],
  USED: ['#9A7800', 'rgba(252,209,22,0.2)'],
  INVALID: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

const EVENT_STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En attente de validation',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
};

const EVENT_STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

/** Un événement ADMIN classique a réellement `status = PUBLISHED` (défaut backend, Story 2.1) ;
 * le fallback ne joue que pour une réponse ancienne/en cache sans ce champ. */
function effectiveStatus(ev: EventItem): OrganizerEventStatus {
  return ev.status ?? 'PUBLISHED';
}

export function EventDetailView(props: Readonly<EventDetailViewProps>) {
  const { event: initialEvent, onBack } = props;
  const { data: eventRows, loading: eventLoading, reload: reloadEvent } = useCollection(() =>
    getEvent(initialEvent.id).then((e) => [e])
  );
  const { data: statsRows, loading: statsLoading } = useCollection(() => getEventStats(initialEvent.id).then((s) => [s]));
  const { data: tickets, loading: ticketsLoading } = useCollection(() => getEventTickets(initialEvent.id));
  const { data: scanRecords, loading: scanLoading } = useCollection(() => getEventScanRecords(initialEvent.id));

  const [newType, setNewType] = useState<TicketType>('STANDARD');
  const [newPrice, setNewPrice] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [editingType, setEditingType] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState(false);
  const { run, banner } = useActionError();

  if (eventLoading || statsLoading || ticketsLoading || scanLoading || eventRows.length === 0) {
    return <LoadingState label="Chargement de l'événement…" />;
  }
  const event = eventRows[0];
  const stats = statsRows[0];
  const status = effectiveStatus(event);
  const [statusColor, statusBg] = EVENT_STATUS_COLOR[status];
  const pendingApproval = status === 'PENDING_APPROVAL';

  const addNewTicketType = () =>
    run(async () => {
      const price = Number(newPrice);
      if (newPrice.trim() === '' || !(price >= 0)) throw new Error('Renseignez un prix (0 pour un billet gratuit).');
      const capacity = newCapacity.trim() === '' ? undefined : Number(newCapacity);
      if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new Error('La capacité doit être un entier d’au moins 1 (laisser vide = illimitée).');
      }
      await addTicketType(event.id, { type: newType, price, capacity });
      setNewPrice('');
      setNewCapacity('');
      reloadEvent();
    });

  const startEditType = (tt: EventTicket) => setEditingType((r) => ({ ...r, [tt.id]: String(tt.price) }));

  const saveType = (tt: EventTicket) =>
    run(async () => {
      const price = editingType[tt.id];
      if (!price) return;
      await updateTicketType(event.id, tt.id, { price: Number(price) });
      setEditingType((r) => {
        const { [tt.id]: _removed, ...rest } = r;
        return rest;
      });
      reloadEvent();
    });

  const removeType = (tt: EventTicket) =>
    run(async () => {
      await deleteTicketType(event.id, tt.id);
      reloadEvent();
    });

  const approve = () =>
    run(async () => {
      await approveEvent(event.id);
      reloadEvent();
    });

  const confirmReject = (reason: string) =>
    run(async () => {
      await rejectEvent(event.id, reason);
      setRejecting(false);
      reloadEvent();
    });

  return (
    <div className="bo-page">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#164A23',
          cursor: 'pointer',
          marginBottom: 18,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        <Icon name="back" size={15} /> Retour aux événements
      </button>
      {banner}

      <div
        className="bo-hero"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600 }}>
            {event.city} · {event.location}
          </span>
          <span
            style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              color: statusColor,
              background: statusBg,
            }}
          >
            {EVENT_STATUS_LABEL[status]}
          </span>
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>
          <CategoryIcon category={event.category} size={26} /> {event.name}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          {new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
        </div>
        {event.desc && <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.85)', marginTop: 10 }}>{event.desc}</div>}

        {pendingApproval && (
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button type="button" onClick={approve} style={bigBtn('#164A23')}>
              Approuver
            </button>
            <button type="button" onClick={() => setRejecting(true)} style={bigBtn('#A6341D')}>
              Rejeter
            </button>
          </div>
        )}
      </div>

      {status === 'REJECTED' && event.rejectionReason && (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #F5DCD4',
            background: '#FBEDE8',
            color: '#8A2E17',
            fontSize: 13.5,
          }}
        >
          <strong>Motif du rejet :</strong> {event.rejectionReason}
        </div>
      )}

      {rejecting && (
        <ConfirmDialog
          title="Rejeter l'événement"
          message={`Rejeter l'événement ${event.name} ?`}
          reasonLabel="Motif du rejet"
          reasonPlaceholder="Expliquez pourquoi cet événement est rejeté…"
          confirmLabel="Rejeter"
          onConfirm={confirmReject}
          onCancel={() => setRejecting(false)}
        />
      )}

      {stats && (
        <div className="bo-kpi-grid" style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Billets émis', value: stats.totalTickets },
            { label: 'Billets scannés', value: stats.scanned },
            { label: 'Scans valides', value: stats.valid },
            { label: 'Scans refusés', value: stats.invalid + stats.used },
          ].map((k) => (
            <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E7DED0', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(31,46,53,0.06)' }}>
              <div style={{ fontSize: 11.5, color: '#6B6459', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 800, color: '#164A23' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Image de l'événement</div>
          <ImagePicker
            imageUrl={event.imageUrl}
            size={140}
            onUpload={(file) => uploadEventImage(event.id, file).then(() => reloadEvent())}
            onSelectPreset={(key) => setEventImagePreset(event.id, key).then(() => reloadEvent())}
            onClear={() => clearEventImage(event.id).then(() => reloadEvent())}
          />
        </div>

        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Types de billets</div>

          <div className="bo-compact-form-row" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value as TicketType)} style={selectStyle}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TICKET_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Prix en FCFA (0 = gratuit)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ ...selectStyle, flex: 1 }}
            />
            <input
              type="number"
              min={1}
              placeholder="Places (illimité si vide)"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              style={{ ...selectStyle, flex: 1 }}
            />
            <button type="button" onClick={addNewTicketType} style={smallBtn('#164A23')}>
              Ajouter
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {event.tickets.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun type de billet.</div>}
            {event.tickets.map((tt) => {
              const draft = editingType[tt.id];
              return (
                <div key={tt.id} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ImagePicker
                      imageUrl={tt.imageUrl ?? null}
                      size={40}
                      onUpload={(file) => uploadTicketTypeImage(event.id, tt.id, file).then(() => reloadEvent())}
                      onSelectPreset={(key) => setTicketTypeImagePreset(event.id, tt.id, key).then(() => reloadEvent())}
                      onClear={() => clearTicketTypeImage(event.id, tt.id).then(() => reloadEvent())}
                    />
                    <TicketTypePill type={tt.type} />
                    {tt.price === 0 && <FreePill />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{TICKET_LABELS[tt.type]}</span>
                  </div>
                  {draft !== undefined ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={draft}
                        onChange={(e) => setEditingType((r) => ({ ...r, [tt.id]: e.target.value }))}
                        style={{ ...selectStyle, width: 110 }}
                      />
                      <button type="button" onClick={() => saveType(tt)} style={smallBtn('#164A23')}>
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6B6459' }}>
                        {tt.price === 0 ? '0 FCFA' : `${tt.price.toLocaleString('fr-FR')} FCFA`} ·{' '}
                        {tt.capacity == null ? 'illimité' : `${tt.remaining ?? 0}/${tt.capacity} restant(s)`}
                      </span>
                      <button type="button" onClick={() => startEditType(tt)} style={smallBtn('#164A23')}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => removeType(tt)} style={smallBtn('#A6341D')}>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bo-detail-grid" style={{ display: 'grid', gap: 18 }}>
          <div className="bo-card" style={cardStyle}>
            <div style={cardTitleStyle}>Billets émis ({tickets.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {tickets.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun billet émis.</div>}
              {tickets.map((t) => (
                <div key={t.code} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{t.holder}</div>
                    <div style={{ fontSize: 11, color: '#6B6459' }}>
                      {t.code} · {t.type}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      color: t.used ? '#9A7800' : '#0F9430',
                      background: t.used ? 'rgba(252,209,22,0.2)' : 'rgba(20,181,58,0.12)',
                    }}
                  >
                    {t.used ? `Utilisé ${t.usedAt ?? ''}` : 'Non utilisé'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bo-card" style={cardStyle}>
            <div style={cardTitleStyle}>Historique des scans ({scanRecords.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {scanRecords.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun scan enregistré.</div>}
              {scanRecords.map((s, idx) => {
                const [color, bg] = STATUS_COLOR[s.status] ?? ['#1F2E35', '#E4E9EB'];
                return (
                  <div key={`${s.code}-${idx}`} style={rowStyle}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{s.code}</div>
                      <div style={{ fontSize: 11, color: '#6B6459' }}>
                        {s.staffName} · {s.time}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        color,
                        background: bg,
                      }}
                    >
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
